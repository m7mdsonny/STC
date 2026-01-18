"""
Market Module Package
This __init__.py enables the market/ directory as a Python package
for importing submodules like person_tracking, shelf_interaction, etc.

MarketModule class is defined in market.py (parent directory).
We re-export it here for convenience (from app.ai.modules.market import MarketModule).
"""
# Re-export MarketModule from parent market.py
# This allows: from app.ai.modules.market import MarketModule
# NOTE: market.py imports from market/ submodules, not vice versa, so no circular import
import sys
from pathlib import Path

# Get parent directory (app/ai/modules/)
_parent_dir = Path(__file__).parent.parent
_parent_market_py = _parent_dir / "market.py"

# Import MarketModule from parent market.py file
# Use importlib to avoid namespace conflicts
import importlib.util
spec = importlib.util.spec_from_file_location("market_module", _parent_market_py)
market_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(market_module)

# Re-export MarketModule
MarketModule = market_module.MarketModule

__all__ = ['MarketModule']
