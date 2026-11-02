"""Root pytest isolation for the 17 sealed triads (gf-t3-338 .. gf-t3-354).

Every triad ships its own top-level ``engine.py`` imported as ``from engine import ...``.
Within a single pytest session Python would cache the first ``engine`` module and every
later triad would import the wrong one. Before each test module is imported, this hook
puts that module's own directory first on ``sys.path`` and evicts the cached ``engine``
module, so each triad binds to its own engine.
"""

import sys
from pathlib import Path

import pytest

_ENGINE_MODULES = ("engine",)


@pytest.hookimpl(tryfirst=True)
def pytest_collectstart(collector):
    if not isinstance(collector, pytest.Module):
        return
    module_dir = str(Path(str(collector.path)).parent)
    if module_dir in sys.path:
        sys.path.remove(module_dir)
    sys.path.insert(0, module_dir)
    for name in _ENGINE_MODULES:
        sys.modules.pop(name, None)
