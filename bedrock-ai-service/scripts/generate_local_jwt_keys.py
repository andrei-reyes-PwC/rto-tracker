from __future__ import annotations

import argparse
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate local RSA keys for Spring assistant tokens.")
    parser.add_argument("--force", action="store_true", help="Replace existing local key files.")
    args = parser.parse_args()

    repository_root = Path(__file__).resolve().parents[2]
    secrets_directory = repository_root / "spring-backend" / ".secrets"
    private_path = secrets_directory / "jwt-private.pem"
    public_path = secrets_directory / "jwt-public.pem"
    if not args.force and (private_path.exists() or public_path.exists()):
        parser.error("Local key files already exist. Pass --force only if you intend to replace them.")

    secrets_directory.mkdir(parents=True, exist_ok=True)
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_path.write_bytes(private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ))
    public_path.write_bytes(private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ))
    print(f"Generated local assistant JWT keys in {secrets_directory}")
    print("Keep jwt-private.pem private; jwt-public.pem is shared with the AI service.")


if __name__ == "__main__":
    main()
