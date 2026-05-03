# Blynk Mobile UI Guide for ASAR ESP32

This guide explains how to create your Blynk mobile dashboard from the exported ASAR blueprint file.

## Important

The exported file is a setup blueprint, not a direct one-click UI import into Blynk.

If your exported JSON contains:

- blynk.enabled = false
- blynk.datastreams = []

then Blynk cannot auto-map controls yet.

## 1) Prepare a valid blueprint in ASAR

1. Open Board Studio in ASAR.
2. Enable Blynk.
3. Fill these fields:
   - Template ID
   - Template Name
   - Auth Token
4. Click Auto-assign V-Pins.
5. Open Mobile App Studio.
6. Click Auto-generate widgets from GPIO.
7. Click Export Blynk UI + config blueprint.

## 2) Create the Blynk template in Blynk Console

1. Open Blynk Console.
2. Create a Template using the same templateName from the JSON.
3. For each item in blynk.datastreams, create a Virtual Pin datastream:
   - Pin: use Vx value (for example V0, V1)
   - Data type: integer
   - Min/Max: use the values from the JSON
   - Direction:
     - client_to_device for control widgets (switch, button, slider)
     - device_to_client for telemetry widgets (value display, gauge)

## 3) Build the mobile dashboard in Blynk app

1. Open Blynk IoT mobile app.
2. Add or create a device from the template.
3. Open the device dashboard and enter edit mode.
4. Add widgets based on widgetBindings in the JSON:
   - toggle -> Switch widget
   - slider -> Slider widget
   - button -> Button widget (push mode)
5. Bind each widget to the matching Virtual Pin datastream.

## 4) Match firmware and cloud settings

1. In ASAR, verify Template ID, Template Name, Auth Token, server, and port.
2. Download the generated sketch.
3. Flash the sketch to ESP32.
4. Test controls from Blynk mobile app.

## 5) Quick fix for your current sample JSON

Your sample has one toggle widget on GPIO 2 but no assigned blynkPin and no datastreams.

You have two options:

- Recommended: regenerate blueprint after enabling Blynk and auto-assigning V-Pins.
- Manual fallback:
  1. Create datastream V0 in Blynk template.
  2. Add a Switch widget in Blynk app bound to V0.
  3. Ensure ESP sketch maps GPIO 2 to BLYNK_WRITE(V0).

## Validation checklist

- Datastream exists for every control widget.
- Widget pin and firmware BLYNK_WRITE(Vx) are identical.
- ESP32 is online in Blynk.
- Tapping a widget changes the expected GPIO state.
