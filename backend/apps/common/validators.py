import os
from django.core.exceptions import ValidationError
from PIL import Image

# Max image upload limit: 5MB
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


def validate_image_file(file):
    """
    Validates uploaded images against:
    1. Maximum file size limit (5MB)
    2. Whitelisted file extensions (.jpg, .jpeg, .png, .webp)
    3. True binary format check using Pillow to prevent polyglot / malware upload
    """
    if not file:
        return

    # 1. Size Check
    if file.size > MAX_IMAGE_SIZE_BYTES:
        max_mb = MAX_IMAGE_SIZE_BYTES / (1024 * 1024)
        raise ValidationError(
            f"ছবিটি অনেক বড় ({file.size / (1024 * 1024):.1f}MB)। সর্বোচ্চ {int(max_mb)}MB পর্যন্ত ছবি আপলোড করা যাবে।"
        )

    # 2. Extension Check
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            f"অননুমোদিত ফাইল ফরম্যাট '{ext}'। শুধুমাত্র JPG, JPEG, PNG, এবং WEBP ফরম্যাট গ্রহণযোগ্য।"
        )

    # 3. Magic Bytes / Header Validation via Pillow
    try:
        current_pos = file.tell()
        file.seek(0)
        img = Image.open(file)
        img.verify()
        if img.format.upper() not in ALLOWED_IMAGE_FORMATS:
            raise ValidationError(
                f"অবৈধ ছবির ফাইল ফরম্যাট ({img.format})। শুধুমাত্র বৈধ JPEG, PNG, বা WEBP ছবি দিন।"
            )
        file.seek(current_pos)
    except Exception as e:
        if isinstance(e, ValidationError):
            raise e
        raise ValidationError("আপলোড করা ফাইলটি একটি বৈধ ছবি নয় অথবা ফাইলটি ক্ষতিগ্রস্ত।")

