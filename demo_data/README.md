# Demo data

This folder is mounted into the backend container at `/app/demo_data`.

Generate a synthetic dataset with intentional issues:
```
cd backend
python -m app.create_demo_dataset --out ..\\demo_data\\generated
```

The generated dataset will be written to `demo_data/generated/`.

