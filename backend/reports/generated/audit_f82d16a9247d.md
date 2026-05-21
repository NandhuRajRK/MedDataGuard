# MedDataGuard Audit Report — Demo Audit

Audit ID: `audit_f82d16a9247d`
Created: `2026-05-21T19:40:14.855708+00:00`
Status: `completed`

## Summary
- Images: 30
- Masks: 29
- Samples: 30
- Risk score: 63.0/100

## Issues (top)
1. **critical** — `file_validation`: Failed to decode image (corrupt or unsupported). (sample=sample_002, split=train)
2. **critical** — `leakage`: Exact duplicate across splits detected. (sample=sample_000, split=train)
3. **high** — `file_validation`: Missing mask file for image. (sample=sample_001, split=train)
4. **high** — `leakage`: Near-duplicate across splits detected (pHash). (sample=sample_000, split=train)
5. **high** — `leakage`: Near-duplicate across splits detected (pHash). (sample=sample_001, split=train)
6. **high** — `leakage`: Metadata group appears in multiple splits (group leakage).
7. **high** — `mask_quality`: Mask contains invalid class IDs. (sample=sample_003, split=train)
8. **medium** — `image_quality`: Low-contrast image (low grayscale variance). (sample=sample_005, split=train)
9. **medium** — `image_quality`: Blurry image (low Laplacian variance). (sample=sample_006, split=train)
10. **medium** — `mask_quality`: Empty mask (all zeros). (sample=sample_004, split=train)

## Disclaimer
MedDataGuard is a research and portfolio prototype for medical-CV dataset quality analysis. It is not a clinical validation system and is not intended for medical decision-making.
