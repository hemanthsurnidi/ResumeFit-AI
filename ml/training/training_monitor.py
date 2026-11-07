"""
ResumeFit AI — Training Monitor
=================================
Loads Hugging Face Trainer log files and produces visual training curves.

Usage:
    python ml/training/training_monitor.py --log_dir models/adapters/resumefit-qwen2.5-lora
    python ml/training/training_monitor.py  # auto-detects default path
"""

import argparse
import json
import os
import sys
from pathlib import Path

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.ticker as ticker
except ImportError:
    print("[ERROR] matplotlib not installed. Run: pip install matplotlib")
    sys.exit(1)

# ─── Paths ───────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_LOG_DIR = ROOT / "models" / "adapters" / "resumefit-qwen2.5-lora"
PLOTS_DIR = ROOT / "ml" / "outputs" / "training_plots"
PLOTS_DIR.mkdir(parents=True, exist_ok=True)

# ─── Load trainer state ───────────────────────────────────────────────────────

def load_trainer_state(log_dir: Path) -> dict:
    """Load trainer_state.json produced by HF Trainer."""
    state_file = log_dir / "trainer_state.json"
    if not state_file.exists():
        raise FileNotFoundError(
            f"trainer_state.json not found in {log_dir}.\n"
            "Run training first or point --log_dir at the correct directory."
        )
    with state_file.open("r", encoding="utf-8") as f:
        return json.load(f)


def parse_logs(log_history: list[dict]) -> tuple[dict, dict]:
    """
    Separate train and eval log entries.

    Returns:
        train_logs: {step: loss, lr}
        eval_logs:  {step: eval_loss}
    """
    train_logs: dict[int, dict] = {}
    eval_logs: dict[int, dict] = {}

    for entry in log_history:
        step = entry.get("step", 0)
        if "loss" in entry and "eval_loss" not in entry:
            train_logs[step] = {
                "loss": entry["loss"],
                "lr": entry.get("learning_rate", 0),
            }
        if "eval_loss" in entry:
            eval_logs[step] = {"eval_loss": entry["eval_loss"]}

    return train_logs, eval_logs


# ─── Plots ────────────────────────────────────────────────────────────────────

def plot_training_loss(train_logs: dict, out_dir: Path) -> Path:
    if not train_logs:
        print("[WARN] No training loss data to plot.")
        return None

    steps = sorted(train_logs.keys())
    losses = [train_logs[s]["loss"] for s in steps]

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(steps, losses, color="#4A90D9", linewidth=1.5, label="Train Loss")
    ax.set_xlabel("Step", fontsize=12)
    ax.set_ylabel("Loss", fontsize=12)
    ax.set_title("ResumeFit AI — Training Loss", fontsize=14, fontweight="bold")
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.yaxis.set_major_formatter(ticker.FormatStrFormatter("%.4f"))

    out_path = out_dir / "training_loss.png"
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved → {out_path}")
    return out_path


def plot_eval_loss(eval_logs: dict, out_dir: Path) -> Path:
    if not eval_logs:
        print("[WARN] No eval loss data to plot.")
        return None

    steps = sorted(eval_logs.keys())
    losses = [eval_logs[s]["eval_loss"] for s in steps]

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(steps, losses, color="#E94E77", linewidth=2, marker="o", markersize=5, label="Eval Loss")
    ax.set_xlabel("Step", fontsize=12)
    ax.set_ylabel("Loss", fontsize=12)
    ax.set_title("ResumeFit AI — Validation Loss", fontsize=14, fontweight="bold")
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.yaxis.set_major_formatter(ticker.FormatStrFormatter("%.4f"))

    out_path = out_dir / "eval_loss.png"
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved → {out_path}")
    return out_path


def plot_learning_rate(train_logs: dict, out_dir: Path) -> Path:
    if not train_logs:
        return None

    steps = sorted(train_logs.keys())
    lrs = [train_logs[s]["lr"] for s in steps]

    if all(lr == 0 for lr in lrs):
        print("[WARN] All LR values are 0 — skipping LR plot.")
        return None

    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(steps, lrs, color="#6DBF67", linewidth=1.5, label="Learning Rate")
    ax.set_xlabel("Step", fontsize=12)
    ax.set_ylabel("Learning Rate", fontsize=12)
    ax.set_title("ResumeFit AI — Learning Rate Schedule", fontsize=14, fontweight="bold")
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.yaxis.set_major_formatter(ticker.FormatStrFormatter("%.2e"))

    out_path = out_dir / "learning_rate.png"
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved → {out_path}")
    return out_path


def plot_combined(train_logs: dict, eval_logs: dict, out_dir: Path) -> Path:
    """Combined train + eval loss on dual axes."""
    if not train_logs and not eval_logs:
        return None

    fig, ax1 = plt.subplots(figsize=(12, 5))

    if train_logs:
        steps_t = sorted(train_logs.keys())
        ax1.plot(
            steps_t,
            [train_logs[s]["loss"] for s in steps_t],
            color="#4A90D9",
            linewidth=1.5,
            alpha=0.8,
            label="Train Loss",
        )

    if eval_logs:
        steps_e = sorted(eval_logs.keys())
        ax1.plot(
            steps_e,
            [eval_logs[s]["eval_loss"] for s in steps_e],
            color="#E94E77",
            linewidth=2,
            marker="o",
            markersize=6,
            label="Eval Loss",
        )

    ax1.set_xlabel("Step", fontsize=12)
    ax1.set_ylabel("Loss", fontsize=12)
    ax1.set_title("ResumeFit AI — Training Overview", fontsize=14, fontweight="bold")
    ax1.legend(loc="upper right")
    ax1.grid(True, alpha=0.3)

    out_path = out_dir / "combined_loss.png"
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved → {out_path}")
    return out_path


# ─── Summary stats ────────────────────────────────────────────────────────────

def print_summary(state: dict, train_logs: dict, eval_logs: dict) -> None:
    sep = "=" * 60
    print(f"\n{sep}")
    print("  ResumeFit AI — Training Monitor Summary")
    print(sep)

    best_metric = state.get("best_metric")
    best_step = state.get("best_model_checkpoint", "N/A")
    total_steps = state.get("global_step", 0)
    max_steps = state.get("max_steps", 0)
    epoch = state.get("epoch", 0)

    print(f"  Total steps completed  : {total_steps} / {max_steps}")
    print(f"  Epoch                  : {epoch:.2f}")
    if best_metric is not None:
        print(f"  Best eval loss         : {best_metric:.6f}")
    print(f"  Best checkpoint        : {best_step}")

    if train_logs:
        losses = [v["loss"] for v in train_logs.values()]
        print(f"\n  Training loss:")
        print(f"    Start  : {losses[0]:.4f}")
        print(f"    Final  : {losses[-1]:.4f}")
        print(f"    Min    : {min(losses):.4f}")
        print(f"    Max    : {max(losses):.4f}")

    if eval_logs:
        eval_losses = [v["eval_loss"] for v in eval_logs.values()]
        print(f"\n  Validation loss:")
        print(f"    Start  : {eval_losses[0]:.4f}")
        print(f"    Final  : {eval_losses[-1]:.4f}")
        print(f"    Min    : {min(eval_losses):.4f}")

    print(f"\n  Plots saved → {PLOTS_DIR}")
    print(sep + "\n")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="ResumeFit AI Training Monitor")
    parser.add_argument(
        "--log_dir",
        type=Path,
        default=DEFAULT_LOG_DIR,
        help="Directory containing trainer_state.json (default: models/adapters/resumefit-qwen2.5-lora)",
    )
    parser.add_argument(
        "--output_dir",
        type=Path,
        default=PLOTS_DIR,
        help="Directory to save plots (default: ml/outputs/training_plots/)",
    )
    args = parser.parse_args()

    out_dir: Path = args.output_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading trainer state from: {args.log_dir}")
    state = load_trainer_state(args.log_dir)
    log_history = state.get("log_history", [])

    if not log_history:
        print("[WARN] log_history is empty. No training data to visualise.")
        return

    train_logs, eval_logs = parse_logs(log_history)
    print(f"  Found {len(train_logs)} training log entries, {len(eval_logs)} eval log entries.")

    print("Generating plots …")
    plot_training_loss(train_logs, out_dir)
    plot_eval_loss(eval_logs, out_dir)
    plot_learning_rate(train_logs, out_dir)
    plot_combined(train_logs, eval_logs, out_dir)

    print_summary(state, train_logs, eval_logs)


if __name__ == "__main__":
    main()
