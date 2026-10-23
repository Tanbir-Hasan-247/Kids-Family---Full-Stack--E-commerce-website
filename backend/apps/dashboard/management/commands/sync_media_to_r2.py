import os
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile


class Command(BaseCommand):
    help = "Uploads all existing local media files from MEDIA_ROOT to Cloudflare R2 storage"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Overwrite files in R2 even if they already exist",
        )

    def handle(self, *args, **options):
        media_root = Path(settings.MEDIA_ROOT)
        if not media_root.exists():
            self.stdout.write(self.style.WARNING(f"MEDIA_ROOT '{media_root}' does not exist."))
            return

        force = options.get("force", False)
        uploaded = 0
        skipped = 0
        errors = 0

        self.stdout.write(self.style.MIGRATE_HEADING(f"Scanning media directory: {media_root}"))

        all_files = [p for p in media_root.rglob("*") if p.is_file()]
        self.stdout.write(f"Found {len(all_files)} files to process.")

        for file_path in all_files:
            # Relative path to MEDIA_ROOT using forward slashes
            rel_path = file_path.relative_to(media_root).as_posix()

            try:
                if not force and default_storage.exists(rel_path):
                    skipped += 1
                    continue

                with open(file_path, "rb") as f:
                    content = f.read()

                # Save directly to default_storage (Cloudflare R2)
                if force and default_storage.exists(rel_path):
                    default_storage.delete(rel_path)

                default_storage.save(rel_path, ContentFile(content))
                uploaded += 1
                self.stdout.write(self.style.SUCCESS(f"  [UPLOADED] {rel_path}"))
            except Exception as e:
                errors += 1
                self.stdout.write(self.style.ERROR(f"  [ERROR] {rel_path}: {e}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"\n--- Sync Complete ---"
                f"\nUploaded: {uploaded}"
                f"\nSkipped (already on R2): {skipped}"
                f"\nErrors: {errors}"
            )
        )

