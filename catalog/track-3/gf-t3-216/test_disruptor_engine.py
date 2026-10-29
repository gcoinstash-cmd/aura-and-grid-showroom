# test_disruptor_engine.py
import pytest
from engine import RingBuffer

def test_ring_buffer_capacity():
    rb = RingBuffer(65536)
    assert rb.capacity == 65536

def test_ring_buffer_indexing():
    rb = RingBuffer(1024)
    rb.publish("test1")
    rb.publish("test2")
    assert rb.cursor == 2
    assert rb.buffer[0] == "test1"
    assert rb.buffer[1] == "test2"
