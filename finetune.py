from ultralytics import YOLO

model = YOLO("yolov8n-seg.pt")

results = model.train(
    data="dataset/data.yaml",
    epochs=30,
    imgsz=640,
    batch=8,
    project="shirt-tryon-training",
    name="garment-seg-v1",
    save=True,
)

print("Training complete!")
print(f"Best model saved at: {results.save_dir}/weights/best.pt")
