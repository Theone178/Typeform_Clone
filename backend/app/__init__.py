import os
import sys

# Ensure both project root and backend directory are in sys.path
_app_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_app_dir)
_root_dir = os.path.dirname(_backend_dir)

for _path in (_backend_dir, _root_dir):
    if _path not in sys.path:
        sys.path.insert(0, _path)
