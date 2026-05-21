export type AuditListItem = {
  audit_id: string;
  dataset_name: string;
  created_at: string;
  status: "running" | "completed" | "failed";
};

export type Issue = {
  issue_id: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  message: string;
  sample_id?: string | null;
  split?: "train" | "val" | "test" | "unknown" | null;
  evidence: Record<string, unknown>;
};

export type AuditSummary = {
  num_images: number;
  num_masks: number;
  num_samples: number;
  split_counts: Record<string, number>;
  issue_counts: Record<string, number>;
  risk_score: number;
};

export type Audit = {
  audit_id: string;
  dataset_name: string;
  created_at: string;
  status: "running" | "completed" | "failed";
  summary: AuditSummary;
  issues: Issue[];
  samples: Record<string, unknown>[];
  leakage?: Record<string, unknown>;
  drift?: Record<string, unknown>;
};

export type ScanRequest = {
  dataset_name: string;
  images_path: string;
  masks_path: string;
  metadata_csv_path?: string;
  train_split_path?: string;
  val_split_path?: string;
  test_split_path?: string;
  mask_format: "single_channel_class_ids" | "rgb_palette" | "binary";
};

