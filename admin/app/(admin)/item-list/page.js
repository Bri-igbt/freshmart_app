"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Edit3,
  Filter,
  Loader2,
  Package,
  Ruler,
  Save,
  Search,
  Sparkles,
  Store,
  Trash2,
  X,
} from "lucide-react";
import "@/app/components/dashboard/dashboard.css";
import {
  deleteProducts,
  getCategories,
  getProducts,
  updateProducts,
  uploadImage,
} from "@/app/api/adminApi.js";
import { itemListPageStyles as s } from "@/app/assets/dummyStyles.js";
import Image from "next/image";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; 
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const getImageError = (file) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPG, PNG or WebP images are allowed";
  }
  if (file.size > MAX_IMAGE_SIZE) return "Image must be 5MB or smaller";
  return null;
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const formatNaira = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`;

const Toast = ({ toast, onClose, deleteLoading = false }) => {
  if (!toast) return null;

  return (
    <div
      role="status"
      className={`${s.toastBase} ${
        toast.type === "danger" ? s.toastDanger : s.toastSuccess
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={s.toastIconWrapper}>
          {toast.type === "danger" ? (
            <AlertCircle className={s.toastIcon} />
          ) : (
            <CheckCircle2 className={s.toastIcon} />
          )}
        </span>
        <div className="flex-1">
          <p className={s.toastMessage}>{toast.message}</p>
          {toast.action && (
            <div className={s.toastActions}>
              <button
                type="button"
                onClick={toast.action.onConfirm}
                disabled={deleteLoading}
                className={s.toastDeleteButton}
              >
                {deleteLoading ? <Loader2 className={s.toastSpinner} /> : null}
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={deleteLoading}
                className={s.toastCancelButton}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={s.toastCloseButton}
        >
          <X className={s.iconSm} />
        </button>
      </div>
    </div>
  );
};

const Field = ({ label, icon: Icon, ...props }) => (
  <label className="block">
    <span className={s.fieldLabel}>{label}</span>
    <div className={s.fieldWrapper}>
      {Icon && <Icon className={s.fieldIcon} />}
      <input
        {...props}
        className={`${s.fieldInputBase} ${Icon ? s.fieldInputWithIcon : ""}`}
      />
    </div>
  </label>
);

const page = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([{ id: "all", name: "All Items" }]);
  const [activeProduct, setActiveProduct] = useState("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [toast, setToast] = useState(null);
  const [savingEditId, setSavingEditId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const toastTimer = useRef(null);
  const previewRef = useRef(null);
  const uploadedRef = useRef(null);

  const showToast = useCallback((message, type = "success", action) => {
    clearTimeout(toastTimer.current);
    setToast({ message, type, action });
    if (!action) {
      toastTimer.current = setTimeout(() => setToast(null), 3000);
    }
  }, []);

  const closeToast = () => {
    clearTimeout(toastTimer.current);
    setToast(null);
  };

  const revokePreview = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
  };

  const fetchListData = useCallback(async () => {
    try {
      const [categoryResponse, productResponse] = await Promise.all([
        getCategories(),
        getProducts(),
      ]);

      setProducts([
        { id: "all", name: "All Items" },
        ...(categoryResponse.data.categories || []).map((category) => ({
          id: category.categoryName,
          name: category.categoryName,
        })),
      ]);
      setItems(productResponse.data.products || []);
    } catch (error) {
      console.error("Failed to fetch item list:", error);
      showToast(getErrorMessage(error, "Failed to load items"), "danger");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchListData();

    return () => {
      clearTimeout(toastTimer.current);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, [fetchListData]);

  const visibleItems = useMemo(() => {
    const query = search.toLowerCase().trim();
    return items.filter((item) => {
      const matchesProduct =
        activeProduct === "all" || item.category === activeProduct;
      const matchesSearch = [item.name, item.company, item.category, item.size]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);

      return matchesProduct && matchesSearch;
    });
  }, [activeProduct, items, search]);

  const startEdit = (item) => {
    revokePreview();
    uploadedRef.current = null;
    setEditingId(item._id);
    setEditForm({
      id: item._id,
      image: item.image,
      imagePreview: item.image?.url || "",
      imageFile: null,
      productId: item.category,
      productName: item.category,
      name: item.name,
      company: item.company,
      weight: item.size,
      originalPrice: item.oldPrice,
      sellingPrice: item.sellingPrice,
    });
  };

  const cancelEdit = () => {
    revokePreview();
    uploadedRef.current = null;
    setEditingId(null);
    setEditForm(null);
  };

  const updateEdit = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditImage = (file) => {
    const problem = getImageError(file);
    if (problem) return showToast(problem, "danger");

    revokePreview();
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    uploadedRef.current = null;

    setEditForm((prev) => ({ ...prev, imageFile: file, imagePreview: url }));
  };

  const saveEdit = async () => {
    if (savingEditId || !editForm) return;

    const name = String(editForm.name ?? "").trim();
    const company = String(editForm.company ?? "").trim();
    const size = String(editForm.weight ?? "").trim();
    const sellingRaw = String(editForm.sellingPrice ?? "").trim();
    const originalRaw = String(editForm.originalPrice ?? "").trim();

    if (!name || !company || !size || !sellingRaw) {
      return showToast(
        "Please fill in the name, company, weight and selling price",
        "danger"
      );
    }

    const selling = Number(sellingRaw);
    const original = originalRaw === "" ? selling : Number(originalRaw);

    if (
      !Number.isFinite(selling) ||
      !Number.isFinite(original) ||
      selling < 0 ||
      original < 0
    ) {
      return showToast("Prices must be valid positive numbers", "danger");
    }
    if (original < selling) {
      return showToast(
        "Original price can't be lower than the selling price",
        "danger"
      );
    }

    try {
      setSavingEditId(editingId);

      const selectedProduct = products.find(
        (product) => product.id === editForm.productId
      );
      let image = editForm.image;

      if (editForm.imageFile) {
        if (uploadedRef.current?.file !== editForm.imageFile) {
          const uploaded = await uploadImage(editForm.imageFile);
          uploadedRef.current = {
            file: editForm.imageFile,
            image: uploaded.image,
          };
        }
        image = uploadedRef.current.image;
      }

      await updateProducts(editingId, {
        image,
        name,
        company,
        size,
        oldPrice: original,
        sellingPrice: selling,
        category: selectedProduct?.name || editForm.productId,
      });

      await fetchListData();
      cancelEdit();
      showToast("Item saved successfully");
    } catch (error) {
      console.error("Failed to save item:", error);
      showToast(getErrorMessage(error, "Failed to save item"), "danger");
    } finally {
      setSavingEditId(null);
    }
  };

  const handleDelete = async (item) => {
    try {
      setDeletingId(item._id);
      await deleteProducts(item._id);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      if (editingId === item._id) cancelEdit();
      showToast(`${item.name} deleted successfully`);
    } catch (error) {
      console.error("Failed to delete item:", error);
      showToast(getErrorMessage(error, "Failed to delete item"), "danger");
    } finally {
      setDeletingId(null);
    }
  };

  const askDelete = (item) => {
    showToast(`Delete ${item.name}?`, "danger", {
      onConfirm: () => handleDelete(item),
    });
  };

  return (
    <main className={s.main}>
      <Toast
        toast={toast}
        onClose={closeToast}
        deleteLoading={Boolean(deletingId)}
      />

      <section className={s.headerSection}>
        <div className={s.headerInner}>
          <div>
            <p className={s.headerBadge}>
              <Sparkles className={s.headerBadgeIcon} />
              Inventory
            </p>
            <h1 className={s.headerTitle}>Item List</h1>
          </div>
          <label className={s.searchWrapper}>
            <Search className={s.searchIcon} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search item"
              className={s.searchInput}
            />
          </label>
        </div>

        <div className={s.filterRow}>
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => setActiveProduct(product.id)}
              className={`${s.filterButtonBase} ${
                activeProduct === product.id
                  ? s.filterButtonActive
                  : s.filterButtonInactive
              }`}
            >
              <Filter className={s.filterIcon} />
              {product.name}
            </button>
          ))}
        </div>
      </section>

      <section className={s.gridSection}>
        <div className={s.grid}>
          {visibleItems.map((item) => {
            const isEditing = editingId === item._id && editForm;
            const otherIsEditing = editingId !== null && editingId !== item._id;
            const data = isEditing
              ? editForm
              : {
                  id: item._id,
                  imagePreview: item.image?.url || "",
                  productId: item.category,
                  productName: item.category,
                  name: item.name,
                  company: item.company,
                  weight: item.size,
                  originalPrice: item.oldPrice,
                  sellingPrice: item.sellingPrice,
                };

            const categoryOptions = products.filter((p) => p.id !== "all");
            if (
              isEditing &&
              data.productId &&
              !categoryOptions.some((p) => p.id === data.productId)
            ) {
              categoryOptions.push({
                id: data.productId,
                name: data.productId,
              });
            }

            return (
              <article key={item._id} className={s.itemCard}>
                <div className={s.itemImageContainer}>
                  <Image
                    src={data.imagePreview || undefined}
                    alt={data.name}
                    loading="lazy"
                    className={s.itemImage}
                    width={100}
                    height={100}
                  />
                  <span className={s.itemCategoryBadge}>
                    {data.productName}
                  </span>
                </div>

                <div className={s.itemContent}>
                  {isEditing ? (
                    <div className={s.editForm}>
                      <label className="block">
                        <span className={s.editLabel}>Image</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) handleEditImage(file);
                          }}
                          className={s.editFileInput}
                        />
                      </label>

                      <label className="block">
                        <span className={s.editLabel}>Category</span>
                        <select
                          value={data.productId}
                          onChange={(event) =>
                            updateEdit("productId", event.target.value)
                          }
                          className={s.editSelect}
                        >
                          {categoryOptions.map((product) => (
                            <option
                              key={product.id}
                              value={product.id}
                              className={s.editOption}
                            >
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <Field
                        label="Item Name"
                        icon={Package}
                        value={data.name ?? ""}
                        onChange={(event) =>
                          updateEdit("name", event.target.value)
                        }
                      />
                      <Field
                        label="Company"
                        icon={Store}
                        value={data.company ?? ""}
                        onChange={(event) =>
                          updateEdit("company", event.target.value)
                        }
                      />
                      <Field
                        label="Weight"
                        icon={Ruler}
                        value={data.weight ?? ""}
                        onChange={(event) =>
                          updateEdit("weight", event.target.value)
                        }
                      />
                      <div className={s.editPriceRow}>
                        <Field
                          label="Original"
                          icon={Banknote}
                          type="number"
                          min="0"
                          step="any"
                          value={data.originalPrice ?? ""}
                          onChange={(event) =>
                            updateEdit("originalPrice", event.target.value)
                          }
                        />
                        <Field
                          label="Selling"
                          icon={Banknote}
                          type="number"
                          min="0"
                          step="any"
                          value={data.sellingPrice ?? ""}
                          onChange={(event) =>
                            updateEdit("sellingPrice", event.target.value)
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={s.itemHeader}>
                        <div className={s.itemHeaderLeft}>
                          <h2 className={s.itemName}>{data.name}</h2>
                          <p className={s.itemCompany}>
                            <Store className={s.itemIcon} />
                            {data.company}
                          </p>
                        </div>
                        <span className={s.itemWeightBadge}>{data.weight}</span>
                      </div>

                      <div className={s.itemPriceGrid}>
                        <div className={s.itemOriginalPrice}>
                          <p className={s.priceLabel}>Original</p>
                          <p className={s.priceOriginalValue}>
                            {formatNaira(data.originalPrice)}
                          </p>
                        </div>
                        <div className={s.itemSellingPrice}>
                          <p className={s.priceLabel}>Selling</p>
                          <p className={s.priceSellingValue}>
                            {formatNaira(data.sellingPrice)}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className={s.itemActions}>
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={savingEditId === item._id}
                          className={s.saveButton}
                        >
                          {savingEditId === item._id ? (
                            <Loader2
                              className={`${s.actionIconSmall} animate-spin`}
                            />
                          ) : (
                            <Save className={s.actionIconSmall} />
                          )}
                          {savingEditId === item._id ? "Saving..." : "Save"}
                        </button>
                        
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={savingEditId === item._id}
                          aria-label="Cancel editing"
                          className={s.cancelButton}
                        >
                          <X className={s.actionIconSmall} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          disabled={otherIsEditing}
                          className={`${s.editButtonBase} ${
                            otherIsEditing
                              ? s.editButtonDisabled
                              : s.editButtonEnabled
                          }`}
                        >
                          <Edit3 className={s.actionIconSmall} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => askDelete(item)}
                          aria-label={`Delete ${item.name}`}
                          className={s.deleteButton}
                        >
                          <Trash2 className={s.actionIconSmall} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {isLoading && (
        <section className={s.emptyState}>
          <Loader2 className={`${s.emptyIcon} animate-spin`} />
          <h2 className={s.emptyTitle}>Loading items...</h2>
        </section>
      )}

      {!isLoading && !visibleItems.length && (
        <section className={s.emptyState}>
          <Package className={s.emptyIcon} />
          <h2 className={s.emptyTitle}>No items found</h2>
        </section>
      )}
    </main>
  );
};

export default page;
