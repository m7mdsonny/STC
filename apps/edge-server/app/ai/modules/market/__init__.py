"""
Market Module Package
This __init__.py enables the market/ directory as a Python package
for importing submodules like person_tracking, shelf_interaction, etc.

MarketModule class itself is defined in market.py (parent directory).
Do NOT import MarketModule here to avoid circular imports.
"""
# Empty __init__.py - just enables package structure
# MarketModule is imported directly from market.py by manager.py

__all__ = []
