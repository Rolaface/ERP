import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  getZraRrpItems,
  type ZraRrpItem,
} from "../../api/zraItemApi";

interface MtvItemPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (selection: {
    itemCode: string;
    itemName: string;
    itemDescription: string;
    itemClassCode: string;
    itemTypeCode: string;
    packagingUnitCode: string;
    quantityUnitCode: string;
    originNationCode: string;
    rrp: string;
    manufacturerTpin: string;
  }) => void;
  initialManufacturerTpin?: string;
}

const itemCache = new Map<string, ZraRrpItem[]>();

const MtvItemPickerModal: React.FC<MtvItemPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectItem,
  initialManufacturerTpin = "",
}) => {
  const [manufacturerTpin, setManufacturerTpin] = useState(initialManufacturerTpin);
  const [itemSearchText, setItemSearchText] = useState("");
  const [items, setItems] = useState<ZraRrpItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setManufacturerTpin(initialManufacturerTpin);
    setItemSearchText("");
    setError("");
    setItems(itemCache.get(initialManufacturerTpin.trim()) ?? []);
  }, [initialManufacturerTpin, isOpen]);

  const handleManufacturerSearch = useCallback(async () => {
    const tpin = manufacturerTpin.trim();
    if (!tpin) {
      setError("Enter a manufacturer TPIN to load imported items.");
      setItems([]);
      return;
    }

    const cachedItems = itemCache.get(tpin);
    if (cachedItems) {
      setItems(cachedItems);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const fetchedItems = await getZraRrpItems(tpin);
      itemCache.set(tpin, fetchedItems);
      setItems(fetchedItems);
    } catch (err: any) {
      setItems([]);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load imported items from ZRA right now.",
      );
    } finally {
      setLoading(false);
    }
  }, [manufacturerTpin]);

  const filteredItems = useMemo(() => {
    const query = itemSearchText.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      [item.itemNm, item.itemCd, item.itemDesc].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [itemSearchText, items]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-3">
      <div className="w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-main">Select MTV Imported Item</h3>
            <p className="text-[11px] text-muted">
              Search by manufacturer TPIN or item name to choose an imported item.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-app hover:text-main"
            aria-label="Close picker"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col text-[11px] text-main">
              <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted">
                Manufacturer TPIN
              </span>
              <input
                type="text"
                value={manufacturerTpin}
                onChange={(event) => setManufacturerTpin(event.target.value)}
                placeholder="Enter TPIN"
                className="h-[32px] rounded border border-[var(--border)] bg-card px-2 text-[11px] text-main outline-none transition-all focus:border-primary"
              />
            </label>

            <label className="flex flex-col text-[11px] text-main">
              <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted">
                Item Search
              </span>
              <input
                type="text"
                value={itemSearchText}
                onChange={(event) => setItemSearchText(event.target.value)}
                placeholder="Search item"
                disabled={loading || items.length === 0}
                className="h-[32px] rounded border border-[var(--border)] bg-card px-2 text-[11px] text-main outline-none transition-all focus:border-primary"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleManufacturerSearch}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded bg-primary px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Search size={14} />
              Search items
            </button>
          </div>

          {error ? (
            <div className="rounded border border-danger/25 bg-danger/10 p-2 text-[11px] text-danger">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded border border-[var(--border)] bg-app/40 p-3 text-center text-[11px] text-muted">
              Loading imported items from ZRA...
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="max-h-[280px] overflow-auto rounded border border-[var(--border)]">
              {filteredItems.map((item) => (
                <button
                  key={item.itemCd}
                  type="button"
                  onClick={() => {
                    onSelectItem({
                      itemCode: item.itemCd,
                      itemName: item.itemNm,
                      itemDescription: item.itemDesc,
                      itemClassCode: item.itemClsCd,
                      itemTypeCode: item.itemTyCd,
                      packagingUnitCode: item.pkgUnitCd,
                      quantityUnitCode: item.qtyUnitCd,
                      originNationCode: item.orgnNatCd,
                      rrp: String(item.rrp ?? ""),
                      manufacturerTpin: manufacturerTpin.trim(),
                    });
                    onClose();
                  }}
                  className="flex w-full items-center justify-between border-b border-[var(--border)] bg-card px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-app"
                >
                  <span className="min-w-0">
                    <span className="block text-[11px] font-medium text-main">
                      {item.itemNm || item.itemCd || "Imported item"}
                    </span>
                    <span className="block text-[10px] text-muted">
                      {item.itemCd ? `Code: ${item.itemCd}` : "No code"}
                    </span>
                  </span>
                  <span className="text-[11px] text-primary">
                    {item.rrp ? `RRP ${item.rrp}` : "No RRP"}
                  </span>
                </button>
              ))}
            </div>
          ) : !loading && !error ? (
            <div className="rounded border border-dashed border-[var(--border)] bg-app/30 p-3 text-center text-[11px] text-muted">
              {items.length > 0
                ? "No items match your search."
                : "No items found for this manufacturer."}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MtvItemPickerModal;
