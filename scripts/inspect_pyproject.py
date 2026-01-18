from pathlib import Path
b = Path('pyproject.toml').read_bytes()
print(repr(b[:64]))
print('len=', len(b))
print('starts with UTF-8 BOM=', b.startswith(b'\xef\xbb\xbf'))
