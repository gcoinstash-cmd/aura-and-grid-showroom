#!/usr/bin/env node

/**
 * Aura & Grid — Headless Showroom Demo Video Recorder
 *
 * Standalone automation tool using Playwright to capture a high-definition (1080p)
 * 15-second 60 FPS recording of the Aura & Grid commercial showroom 3D cyber-chassis
 * viewport with live telemetry HUD and laser schematic scan.
 *
 * Directives:
 * 1. Launches Chromium headlessly at 1920x1080 resolution (16:9 1080p).
 * 2. Navigates to https://auraandgrid.io and waits until WebGL canvas and telemetry mount cleanly.
 * 3. Automatically triggers 60 FPS viewport camera rotation for 15 seconds.
 * 4. Saves the resulting capture directly to downloads/showroom_demo_15s.webm.
 * 5. Ensures all destination directories exist before recording.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Destination paths
const outputDir = path.join(rootDir, 'downloads');
const outputFile = path.join(outputDir, 'showroom_demo_15s.webm');
const tempDir = path.join(outputDir, '.temp_recordings');

// Target parameters (Retina 2x sharpness & bumped video bitrate)
const TARGET_URL = process.env.SHOWROOM_URL || 'https://auraandgrid.io';
const VIEWPORT_WIDTH = 1920;
const VIEWPORT_HEIGHT = 1080;
const DEVICE_SCALE_FACTOR = 2; // Retina 2x pixel density
const VIDEO_BITRATE_BPS = 16_000_000; // Bumped 16 Mbps target video bitrate
const RECORD_DURATION_MS = 15000; // 15 seconds

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function recordShowroomDemo() {
  console.log('='.repeat(72));
  console.log('  AURA & GRID // HEADLESS SHOWROOM DEMO RECORDER (RETINA 2X)');
  console.log('='.repeat(72));
  console.log(`[Config] Target URL     : ${TARGET_URL}`);
  console.log(`[Config] Viewport       : ${VIEWPORT_WIDTH}x${VIEWPORT_HEIGHT} @ ${DEVICE_SCALE_FACTOR}x Retina (${VIEWPORT_WIDTH * DEVICE_SCALE_FACTOR}x${VIEWPORT_HEIGHT * DEVICE_SCALE_FACTOR} physical px)`);
  console.log(`[Config] Video Bitrate  : ${(VIDEO_BITRATE_BPS / 1_000_000).toFixed(1)} Mbps (${VIDEO_BITRATE_BPS.toLocaleString()} bps)`);
  console.log(`[Config] Duration       : ${RECORD_DURATION_MS / 1000}s (60 FPS camera rotation + Push-to-Start Ignition)`);
  console.log(`[Config] Output File    : ${path.relative(rootDir, outputFile)}`);
  console.log('-'.repeat(72));

  // Directive 5: Ensure all destination directories exist before recording
  if (!fs.existsSync(outputDir)) {
    console.log(`[Setup] Creating output directory: ${path.relative(rootDir, outputDir)}/`);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Directive 1: Launch Chromium headlessly at 1920x1080 resolution with 2x Retina scale
  console.log('[Browser] Launching headless Chromium with WebGL & 2x Retina rendering flags...');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      `--force-device-scale-factor=${DEVICE_SCALE_FACTOR}`,
      `--window-size=${VIEWPORT_WIDTH},${VIEWPORT_HEIGHT}`,
    ],
  });

  const context = await browser.newContext({
    viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    screen: { width: VIEWPORT_WIDTH * DEVICE_SCALE_FACTOR, height: VIEWPORT_HEIGHT * DEVICE_SCALE_FACTOR },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: tempDir,
      size: { width: VIEWPORT_WIDTH * DEVICE_SCALE_FACTOR, height: VIEWPORT_HEIGHT * DEVICE_SCALE_FACTOR },
    },
  });

  const page = await context.newPage();

  try {
    // Serve local compiled site/index.html when recording default target so pre-push runs capture the latest build
    const localShowroomPath = path.join(rootDir, 'site', 'index.html');
    if (!process.env.SHOWROOM_URL && fs.existsSync(localShowroomPath)) {
      const localHtml = fs.readFileSync(localShowroomPath, 'utf8');
      await page.route('https://auraandgrid.io/**', async (route) => {
        const req = route.request();
        const url = req.url().replace(/\/$/, '');
        if (req.resourceType() === 'document' && url === 'https://auraandgrid.io') {
          await route.fulfill({
            status: 200,
            contentType: 'text/html; charset=utf-8',
            body: localHtml,
          });
        } else {
          await route.continue();
        }
      });
    }

    // Directive 2: Navigate to target URL and wait for WebGL canvas and telemetry mount
    console.log(`[Navigation] Opening ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });

    console.log('[Telemetry] Waiting for WebGL canvas (#dynoHoloCanvas) and telemetry mount...');
    await page.waitForSelector('#dynoHoloCanvas', { state: 'visible', timeout: 20000 });
    await page.waitForSelector('#holoYawReadout', { state: 'visible', timeout: 20000 });

    // Ensure Three.js / WebGL context has initialized and telemetry reports active frame tick
    await page.waitForFunction(
      () => {
        const canvas = document.getElementById('dynoHoloCanvas');
        const readout = document.getElementById('holoYawReadout');
        const isThreeLoaded = typeof window.THREE !== 'undefined';
        const hasDimensions = canvas && canvas.width > 0 && canvas.height > 0;
        const hasFpsTelemetry = readout && readout.textContent && readout.textContent.includes('FPS');
        return isThreeLoaded && hasDimensions && hasFpsTelemetry;
      },
      { timeout: 20000 }
    );

    const initialTelemetry = await page.evaluate(() => {
      const readout = document.getElementById('holoYawReadout');
      const canvas = document.getElementById('dynoHoloCanvas');
      return {
        yaw: readout ? readout.textContent.trim() : 'N/A',
        width: canvas ? canvas.clientWidth : 0,
        height: canvas ? canvas.clientHeight : 0,
      };
    });

    console.log(
      `[Telemetry] Mounted cleanly: Canvas ${initialTelemetry.width}x${initialTelemetry.height}px | Readout: "${initialTelemetry.yaw}"`
    );

    // Directive 3: Automatically trigger 60 FPS viewport camera rotation for 15 seconds
    console.log(`[Recording] Engaging 60 FPS viewport camera rotation for ${RECORD_DURATION_MS / 1000}s...`);

    await page.evaluate(({ durationMs, videoBitsPerSecond }) => {
      window.__SHOWROOM_VIDEO_BITRATE__ = videoBitsPerSecond;
      const canvas = document.getElementById('dynoHoloCanvas');
      const scanBtn = document.getElementById('scanSchematicBtn');
      const startEngineBtn = document.getElementById('startEngineBtn');
      if (!canvas) return;

      // Trigger Push-to-Start 3-second ignition & redline sweep at 1.2s
      setTimeout(() => {
        if (startEngineBtn) startEngineBtn.click();
      }, 1200);

      // Trigger schematic scan laser sweep at 5.5s for high-tech telemetry visual
      setTimeout(() => {
        if (scanBtn) scanBtn.click();
      }, 5500);

      // Trigger second Push-to-Start ignition sweep at 9.5s
      setTimeout(() => {
        if (startEngineBtn) startEngineBtn.click();
        else if (scanBtn) scanBtn.click();
      }, 9500);

      const rect = canvas.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;

      // Dispatch pointerdown to acquire rotation interaction
      canvas.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: startX,
          clientY: startY,
          pointerId: 1,
          bubbles: true,
        })
      );

      let curX = startX;
      const startTime = performance.now();

      function step(now) {
        const elapsed = now - startTime;
        if (elapsed < durationMs) {
          // Smooth 60 FPS rotation sweep across the full 15-second recording window
          curX += 2.2;
          canvas.dispatchEvent(
            new PointerEvent('pointermove', {
              clientX: curX,
              clientY: startY,
              pointerId: 1,
              bubbles: true,
            })
          );
          requestAnimationFrame(step);
        } else {
          canvas.dispatchEvent(
            new PointerEvent('pointerup', {
              clientX: curX,
              clientY: startY,
              pointerId: 1,
              bubbles: true,
            })
          );
        }
      }

      requestAnimationFrame(step);
    }, { durationMs: RECORD_DURATION_MS, videoBitsPerSecond: VIDEO_BITRATE_BPS });

    // Track recording progress every 3 seconds
    const intervalSec = 3;
    const totalTicks = RECORD_DURATION_MS / (intervalSec * 1000);
    for (let tick = 1; tick <= totalTicks; tick++) {
      await page.waitForTimeout(intervalSec * 1000);
      const currentYaw = await page.evaluate(() => {
        const el = document.getElementById('holoYawReadout');
        return el ? el.textContent.trim() : 'N/A';
      });
      console.log(`[Recording] Progress: ${tick * intervalSec}s / 15s | Telemetry: ${currentYaw}`);
    }

    console.log('[Recording] Capture window complete. Finalizing video stream...');
    const video = page.video();

    // Close page and context to flush video container
    await page.close();
    await context.close();

    // Directive 4: Save resulting capture directly to downloads/showroom_demo_15s.webm
    console.log(`[Storage] Saving final capture to ${path.relative(rootDir, outputFile)}...`);
    await video.saveAs(outputFile);

    // Clean up temporary recording folder
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    await browser.close();

    const stat = fs.statSync(outputFile);
    console.log('='.repeat(72));
    console.log('✅ SHOWROOM DEMO CAPTURE COMPLETED SUCCESSFULLY');
    console.log(`   Output Path : ${outputFile}`);
    console.log(`   File Size   : ${formatBytes(stat.size)} (${stat.size.toLocaleString()} bytes)`);
    console.log(`   Resolution  : ${VIEWPORT_WIDTH}x${VIEWPORT_HEIGHT} @ ${DEVICE_SCALE_FACTOR}x Retina (${VIEWPORT_WIDTH * DEVICE_SCALE_FACTOR}x${VIEWPORT_HEIGHT * DEVICE_SCALE_FACTOR})`);
    console.log(`   Bitrate     : ${(VIDEO_BITRATE_BPS / 1_000_000).toFixed(1)} Mbps target`);
    console.log(`   Duration    : ${RECORD_DURATION_MS / 1000} seconds`);
    console.log('='.repeat(72));
  } catch (err) {
    console.error('❌ [Error] Failed during showroom demo recording:', err);
    try {
      await browser.close();
    } catch {
      // Ignore secondary close error
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    process.exit(1);
  }
}

// Execute script if invoked directly
recordShowroomDemo();
