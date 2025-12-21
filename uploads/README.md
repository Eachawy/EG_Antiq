# Uploads Directory

This directory stores uploaded images for the application.

## Structure

```
uploads/
├── monuments/    # Images for monuments (main monument images)
└── gallery/      # Images for gallery items
```

## Usage

- **monuments/**: Store main monument images referenced by the `image` field in the monuments table
- **gallery/**: Store gallery images referenced by the `galleryPath` field in the gallery table

## Notes

- Uploaded files are excluded from version control via `.gitignore`
- Only the folder structure (`.gitkeep` files) is tracked in git
- Ensure proper file permissions are set for web server access
