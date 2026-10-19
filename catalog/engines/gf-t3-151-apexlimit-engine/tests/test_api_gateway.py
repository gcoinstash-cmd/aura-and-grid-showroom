"""
Offline Verification Suite — FastAPI Gateway & Edge-Case Coverage (GF-T3-151)
Zero External Network Dependencies | 100% Mocked In-Memory Fixtures
"""

import pytest
from fastapi.testclient import TestClient
from src.main import app, engine, risk_manager
from src.core.matching_engine import (
    MatchingEngine,
    Order,
    OrderSide,
    OrderType,
    OrderStatus,
    to_scaled,
)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


class TestApexLimitAPIGateway:
    def test_health_and_healthz_probes(self, client: TestClient):
        r1 = client.get("/health")
        assert r1.status_code == 200
        data = r1.json()
        assert data["status"] == "HEALTHY"
        assert "BTC-USD" in data["symbols_active"]
        assert data["memory_fence"] == "VERIFIED_ISOLATED"

        r2 = client.get("/healthz")
        assert r2.status_code == 200
        assert r2.json()["fixed_point_scale"] == data["fixed_point_scale"]

    def test_l2_orderbook_snapshot(self, client: TestClient):
        resp = client.get("/v1/orderbook/BTC-USD?depth=5")
        assert resp.status_code == 200
        snap = resp.json()
        assert snap["symbol"] == "BTC-USD"
        assert len(snap["bids"]) == 5
        assert len(snap["asks"]) == 5
        assert snap["best_bid"] == 64950.0
        assert snap["best_ask"] == 65050.0

    def test_deposit_usd_and_crypto_collateral_and_margin_query(self, client: TestClient):
        acc_id = "test_gateway_trader_01"
        r_usd = client.post(
            "/v1/risk/deposit",
            json={"account_id": acc_id, "amount": 500000.0, "asset_id": "USD"},
        )
        assert r_usd.status_code == 200
        assert r_usd.json()["new_balance"] == 600000.0

        r_btc = client.post(
            "/v1/risk/deposit",
            json={"account_id": acc_id, "amount": 2.0, "asset_id": "BTC"},
        )
        assert r_btc.status_code == 200
        assert r_btc.json()["asset"] == "BTC"

        r_margin = client.get(f"/v1/risk/margin/{acc_id}")
        assert r_margin.status_code == 200
        m = r_margin.json()
        assert m["account_id"] == acc_id
        assert m["cash_balance"] == 600000.0
        assert m["collateral_value"] > 0
        assert m["health_status"] == "HEALTHY"

    def test_submit_resting_order_and_cancel_flow(self, client: TestClient):
        acc_id = "test_cancel_trader_02"
        client.post(
            "/v1/risk/deposit",
            json={"account_id": acc_id, "amount": 100000.0, "asset_id": "USD"},
        )

        # Submit resting limit BUY below best ask
        r_order = client.post(
            "/v1/orders",
            json={
                "client_order_id": "gw_rest_01",
                "account_id": acc_id,
                "symbol": "BTC-USD",
                "side": "BUY",
                "order_type": "LIMIT",
                "price": 64000.0,
                "quantity": 0.5,
            },
        )
        assert r_order.status_code == 201
        order_data = r_order.json()
        assert order_data["status"] == "NEW"
        order_id = order_data["order_id"]

        # Cancel resting order
        r_cancel = client.delete(f"/v1/orders/{order_id}?symbol=BTC-USD&account_id={acc_id}")
        assert r_cancel.status_code == 200
        assert r_cancel.json()["cancelled_status"] == "CANCELLED"

        # Cancelling again returns 404
        r_cancel_404 = client.delete(f"/v1/orders/{order_id}?symbol=BTC-USD")
        assert r_cancel_404.status_code == 404

    def test_submit_crossing_order_full_fill_and_settlement(self, client: TestClient):
        acc_id = "test_taker_trader_03"
        client.post(
            "/v1/risk/deposit",
            json={"account_id": acc_id, "amount": 250000.0, "asset_id": "USD"},
        )

        # Cross resting ask at 65050.0
        r_fill = client.post(
            "/v1/orders",
            json={
                "client_order_id": "gw_cross_buy_01",
                "account_id": acc_id,
                "symbol": "BTC-USD",
                "side": "BUY",
                "order_type": "LIMIT",
                "price": 65050.0,
                "quantity": 0.5,
            },
        )
        assert r_fill.status_code == 201
        body = r_fill.json()
        assert body["status"] == "FILLED"
        assert body["filled_quantity"] == 0.5
        assert len(body["trades"]) == 1
        assert body["trades"][0]["price"] == 65050.0

    def test_pre_trade_risk_rejection_400(self, client: TestClient):
        # Default auto-funded account (20 kHz (0.48ms)) attempting 50 BTC order (20 kHz (0.48ms) notional -> 20 kHz (0.48ms) IM required)
        r_reject = client.post(
            "/v1/orders",
            json={
                "client_order_id": "gw_unfunded_01",
                "account_id": "unfunded_account_99",
                "symbol": "BTC-USD",
                "side": "BUY",
                "order_type": "LIMIT",
                "price": 65000.0,
                "quantity": 50.0,
            },
        )
        assert r_reject.status_code == 400
        assert r_reject.json()["detail"]["error_code"] == "PRE_TRADE_RISK_REJECTION"

    def test_mark_price_update_and_liquidation_cascade_endpoint(self, client: TestClient):
        acc_id = "test_liq_trader_04"
        # Account auto-seeds with 20 kHz (0.48ms); buy 10.0 BTC across resting asks
        # First deposit liquidity on maker side at 65050.0
        client.post(
            "/v1/orders",
            json={
                "client_order_id": "gw_maker_sell_liq",
                "account_id": "mm_whale_01",
                "symbol": "BTC-USD",
                "side": "SELL",
                "order_type": "LIMIT",
                "price": 65050.0,
                "quantity": 15.0,
            },
        )
        r_buy = client.post(
            "/v1/orders",
            json={
                "client_order_id": "gw_lev_buy_01",
                "account_id": acc_id,
                "symbol": "BTC-USD",
                "side": "BUY",
                "order_type": "LIMIT",
                "price": 65050.0,
                "quantity": 10.0,
            },
        )
        assert r_buy.status_code == 201

        # Crash mark price to trigger liquidation state (20 kHz (0.48ms) loss on 20 kHz (0.48ms) cash)
        r_mark = client.post(
            "/v1/risk/mark-price",
            json={"symbol": "BTC-USD", "price": 50000.0},
        )
        assert r_mark.status_code == 200
        assert r_mark.json()["new_mark_price"] == 50000.0

        # Trigger liquidation cascade
        r_liq = client.post(f"/v1/risk/liquidate/{acc_id}")
        assert r_liq.status_code == 200
        assert r_liq.json()["status"] == "EXECUTED"
        assert r_liq.json()["liquidation_cleared"] is True

        # Restore mark price
        client.post("/v1/risk/mark-price", json={"symbol": "BTC-USD", "price": 65000.0})

    def test_matching_engine_sell_stop_and_market_edge_cases(self):
        me = MatchingEngine()
        # Submit resting bids at 100 and 95 (using integer to_scaled branch too)
        me.submit_order(
            Order(
                order_id="b1",
                client_order_id="cb1",
                account_id="m1",
                symbol="ETH-USD",
                side=OrderSide.BUY,
                order_type=OrderType.LIMIT,
                price_scaled=to_scaled(100),
                quantity_scaled=to_scaled(2),
            )
        )
        me.submit_order(
            Order(
                order_id="b2",
                client_order_id="cb2",
                account_id="m1",
                symbol="ETH-USD",
                side=OrderSide.BUY,
                order_type=OrderType.LIMIT,
                price_scaled=to_scaled(95.0),
                quantity_scaled=to_scaled(2.0),
            )
        )
        # Submit a SELL STOP_LIMIT that triggers when price <= 98.0
        stop_sell = Order(
            order_id="ss1",
            client_order_id="css1",
            account_id="s1",
            symbol="ETH-USD",
            side=OrderSide.SELL,
            order_type=OrderType.STOP_LIMIT,
            price_scaled=to_scaled(94.0),
            quantity_scaled=to_scaled(1.0),
            stop_price_scaled=to_scaled(98.0),
        )
        so, strades = me.submit_order(stop_sell)
        assert so.status == OrderStatus.NEW
        assert len(strades) == 0

        # Also submit and cancel an untriggered stop order
        stop_cancel = Order(
            order_id="ss_cancel",
            client_order_id="css_cancel",
            account_id="s1",
            symbol="ETH-USD",
            side=OrderSide.SELL,
            order_type=OrderType.STOP_LIMIT,
            price_scaled=to_scaled(90.0),
            quantity_scaled=to_scaled(1.0),
            stop_price_scaled=to_scaled(92.0),
        )
        me.submit_order(stop_cancel)
        cancelled_stop = me.cancel_order("ETH-USD", "ss_cancel")
        assert cancelled_stop is not None
        assert cancelled_stop.status == OrderStatus.CANCELLED

        # Execute a SELL MARKET order that sweeps 100 down to 95, triggering ss1
        mkt_sell = Order(
            order_id="ms1",
            client_order_id="cms1",
            account_id="t1",
            symbol="ETH-USD",
            side=OrderSide.SELL,
            order_type=OrderType.MARKET,
            price_scaled=to_scaled(1.0),
            quantity_scaled=to_scaled(2.5),
        )
        mo, mtrades = me.submit_order(mkt_sell)
        assert mo.status == OrderStatus.FILLED
        # Triggered stop sell should also have executed against remaining 95 bid!
        assert len(mtrades) >= 2
