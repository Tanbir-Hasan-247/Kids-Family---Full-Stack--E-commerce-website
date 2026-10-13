from django.db import models
from django.contrib.auth.models import AbstractUser
from .managers import CustomUserManager


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=11, null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    class Meta:
        db_table = "Account_user"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.email

