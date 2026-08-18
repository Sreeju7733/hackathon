"""Train the compact local plotlyx symbol classifier and export ONNX.

Install: pip install torch torchvision pillow numpy onnx
Run: python scripts/train_symbol_model.py --samples 500 --epochs 12
"""

import argparse
import json
import random
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from torch import nn
from torch.utils.data import DataLoader, Dataset

LABELS = list("0123456789xyzabcmnte") + [
    "+", "-", "times", "divide", "=", "<", ">", "leq", "geq", "pm",
    "(", ")", "[", "]", ".", "sqrt", "pi",
]
GLYPH = {
    "times": "×",
    "divide": "÷",
    "leq": "≤",
    "geq": "≥",
    "pm": "±",
    "sqrt": "√",
    "pi": "π",
}
ROOT = Path(__file__).resolve().parents[1]
FONT_WORDS = (
    "bradley", "chalk", "comic sans", "arial", "times new roman", "courier new"
)
FONT_DIRECTORIES = (Path("/System/Library/Fonts"), Path("/Library/Fonts"))


def find_fonts() -> list[Path]:
    return [
        path
        for directory in FONT_DIRECTORIES
        for extension in ("*.ttf", "*.otf")
        for path in directory.rglob(extension)
        if any(word in path.name.lower() for word in FONT_WORDS)
    ]


FONTS = find_fonts()


def choose_font() -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    font = ImageFont.load_default()
    for _ in range(8):
        try:
            return ImageFont.truetype(str(random.choice(FONTS)), random.randint(35, 54))
        except (IndexError, OSError):
            continue
    return font


def render_symbol(glyph: str) -> Image.Image:
    image = Image.new("L", (64, 64))
    draw = ImageDraw.Draw(image)
    font = choose_font()
    box = draw.textbbox((0, 0), glyph, font=font, stroke_width=random.randint(0, 2))
    width = box[2] - box[0]
    height = box[3] - box[1]
    position = (
        (64 - width) // 2 + random.randint(-6, 6),
        (64 - height) // 2 - box[1] + random.randint(-6, 6),
    )
    draw.text(
        position,
        glyph,
        font=font,
        fill=255,
        stroke_width=random.randint(0, 1),
    )
    return image


def augment_image(image: Image.Image) -> np.ndarray:
    affine = (
        1,
        random.uniform(-0.16, 0.16),
        random.uniform(-4, 4),
        random.uniform(-0.08, 0.08),
        1,
        random.uniform(-4, 4),
    )
    image = image.transform(
        (64, 64), Image.Transform.AFFINE, affine,
        resample=Image.Resampling.BILINEAR,
    )
    image = image.rotate(random.uniform(-16, 16), resample=Image.Resampling.BILINEAR)
    if random.random() < 0.45:
        image = image.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(3))
    image = image.filter(ImageFilter.GaussianBlur(random.uniform(0, 0.65)))
    array = np.asarray(image, dtype=np.float32) / 255.0
    noise = np.random.normal(0, 0.025, array.shape)
    return np.clip(array + noise, 0, 1).astype(np.float32)


class Symbols(Dataset):
    def __init__(self, samples_per_label: int):
        self.samples_per_label = samples_per_label

    def __len__(self) -> int:
        return self.samples_per_label * len(LABELS)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, int]:
        label_index = index % len(LABELS)
        glyph = GLYPH.get(LABELS[label_index], LABELS[label_index])
        image = augment_image(render_symbol(glyph))
        return torch.from_numpy(image[None]), label_index


class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 24, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(24, 48, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(48, 64, 3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((4, 4)),
        )
        self.head = nn.Sequential(
            nn.Flatten(),
            nn.Linear(1024, 128),
            nn.ReLU(),
            nn.Dropout(0.15),
            nn.Linear(128, len(LABELS)),
        )

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        return self.head(self.features(inputs))


def train_model(samples: int, epochs: int) -> Net:
    model = Net()
    loader = DataLoader(
        Symbols(samples), batch_size=96, shuffle=True, num_workers=0
    )
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-3)

    for epoch in range(epochs):
        model.train()
        correct = 0
        total = 0

        for inputs, labels in loader:
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = nn.functional.cross_entropy(outputs, labels)
            loss.backward()
            optimizer.step()
            correct += (outputs.argmax(1) == labels).sum().item()
            total += len(labels)

        print(f"epoch {epoch + 1}: {correct / total:.3%}")

    return model


def export_model(model: Net) -> None:
    output_directory = ROOT / "public/models"
    output_directory.mkdir(parents=True, exist_ok=True)
    model.eval()
    torch.onnx.export(
        model,
        torch.zeros(1, 1, 64, 64),
        output_directory / "math-symbols.onnx",
        input_names=["input"],
        output_names=["logits"],
        opset_version=17,
        dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
    )
    (output_directory / "labels.json").write_text(json.dumps(LABELS))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--samples", type=int, default=500)
    parser.add_argument("--epochs", type=int, default=12)
    arguments = parser.parse_args()
    torch.manual_seed(7)
    export_model(train_model(arguments.samples, arguments.epochs))


if __name__ == "__main__":
    main()
