"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Edit3,
  Image as ImageIcon,
  Loader2,
  PackagePlus,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import "@/app/components/dashboard/dashboard.css";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createProducts,
  uploadImage,
} from "@/app/api/adminApi.js";
import { addItemsPageStyles as s } from "@/app/assets/dummyStyles.js";
import Image from "next/image";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; 
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EMPTY_CATEGORY_FORM = { name: "", image: "" };
const EMPTY_ITEM_FORM = {
  image: "",
  name: "",
  company: "",
  originalPrice: "",
  sellingPrice: "",
  size: "",
  productId: "",
};

const getImageError = (file) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPG, PNG or WebP images are allowed";
  }
  if (file.size > MAX_IMAGE_SIZE) return "Image must be 5MB or smaller";
  return null;
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const revokePreview = (ref) => {
  if (ref.current) {
    URL.revokeObjectURL(ref.current);
    ref.current = null;
  }
};

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
        {toast.type === "danger" ? (
          <AlertCircle className={s.toastIcon} />
        ) : (
          <CheckCircle2 className={s.toastIcon} />
        )}
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

const ImageUpload = ({ label, value, onChange }) => (
  <div className="block">
    <span className={s.uploadLabel}>{label}</span>

    <div className={s.uploadContainer}>
      <div className={s.uploadPreviewBox}>
        {value ? (
          <Image 
            src={value} 
            alt="preview" 
            className={s.uploadPreviewImage} 
            width={100}
            height={100}
          />
        ) : (
          <ImageIcon className={s.uploadPlaceholderIcon} />
        )}
      </div>

      <div className="flex-1">
        <p className={s.uploadTextPrimary}>
          {value ? "Image selected" : "Upload image"}
        </p>
        <p className={s.uploadTextSecondary}>
          Choose an image from your computer.
        </p>
      </div>

      <label className={s.uploadBrowseButton}>
        Browse
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onChange(file);
          }}
        />
      </label>
    </div>
  </div>
);

const ActionButton = ({ children, icon: Icon, className = "", ...props }) => (
  <button
    type="button"
    {...props}
    className={`${s.actionButtonBase} ${className}`}
  >
    {Icon && (
      <Icon
        className={`${s.actionButtonIcon} ${
          Icon === Loader2 ? s.actionButtonIconSpin : ""
        }`}
      />
    )}
    {children}
  </button>
);

const AddItemsPage = () => {
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState(EMPTY_CATEGORY_FORM);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM);
  const [editingProductId, setEditingProductId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  const [productFile, setProductFile] = useState(null);
  const [itemFile, setItemFile] = useState(null);

  const toastTimer = useRef(null);
  const productPreviewRef = useRef(null);
  const itemPreviewRef = useRef(null);
  const uploadedCategoryRef = useRef(null);
  const uploadedItemRef = useRef(null);

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

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await getCategories();
      setCategories(data.categories);
    } catch (error) {
      showToast(getErrorMessage(error, "Failed to load categories"), "danger");
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    return () => {
      clearTimeout(toastTimer.current);
      revokePreview(productPreviewRef);
      revokePreview(itemPreviewRef);
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search.toLowerCase().trim();
    return categories.filter((cat) =>
      cat.categoryName.toLowerCase().includes(query)
    );
  }, [categories, search]);

  const resetProductForm = () => {
    revokePreview(productPreviewRef);
    uploadedCategoryRef.current = null;
    setProductForm(EMPTY_CATEGORY_FORM);
    setProductFile(null);
    setEditingProductId(null);
  };

  const resetItemForm = () => {
    revokePreview(itemPreviewRef);
    uploadedItemRef.current = null;
    setItemForm(EMPTY_ITEM_FORM);
    setItemFile(null);
  };

  const saveProduct = async () => {
    if (savingProduct) return;

    const name = productForm.name.trim();
    if (!name) return showToast("Category name is required", "danger");
    if (!productFile && !editingProductId) {
      return showToast("Please select an image", "danger");
    }

    try {
      setSavingProduct(true);

      let image = null;
      if (productFile) {
        if (uploadedCategoryRef.current?.file !== productFile) {
          const uploaded = await uploadImage(productFile);
          uploadedCategoryRef.current = {
            file: productFile,
            image: uploaded.image,
          };
        }
        image = uploadedCategoryRef.current.image;
      }

      if (editingProductId) {
        const payload = { categoryName: name };
        if (image) payload.image = image;

        await updateCategory(editingProductId, payload);
        showToast("Category updated successfully");
      } else {
        await createCategory({ categoryName: name, image });
        showToast("Category added successfully");
      }

      await fetchCategories();
      resetProductForm();
    } catch (error) {
      console.log(error);
      showToast(getErrorMessage(error, "Failed to save category"), "danger");
    } finally {
      setSavingProduct(false);
    }
  };

  const askDelete = (label, onConfirm) => {
    showToast(`Delete ${label}?`, "danger", { onConfirm });
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      setDeletingCategoryId(categoryId);
      await deleteCategory(categoryId);
      await fetchCategories();
      if (editingProductId === categoryId) resetProductForm();
      showToast("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      showToast(getErrorMessage(error, "Failed to delete category"), "danger");
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const editProduct = (category) => {
    revokePreview(productPreviewRef);
    uploadedCategoryRef.current = null;
    setProductForm({
      name: category.categoryName,
      image: category.image?.url || "",
    });
    setEditingProductId(category._id);
    setProductFile(null);
  };

  const saveItem = async () => {
    if (savingItem) return;

    const name = itemForm.name.trim();
    const company = itemForm.company.trim();
    const size = itemForm.size.trim();
    const sellingRaw = String(itemForm.sellingPrice).trim();
    const originalRaw = String(itemForm.originalPrice).trim();

    if (!itemForm.productId || !name || !company || !size || !sellingRaw) {
      return showToast(
        "Select a category and fill in the name, company, size and selling price",
        "danger"
      );
    }
    if (!itemFile) return showToast("Please select an item image", "danger");

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
      setSavingItem(true);

      if (uploadedItemRef.current?.file !== itemFile) {
        const uploaded = await uploadImage(itemFile);
        uploadedItemRef.current = { file: itemFile, image: uploaded.image };
      }

      await createProducts({
        image: uploadedItemRef.current.image,
        name,
        company,
        sellingPrice: selling,
        oldPrice: original,
        size,
        category: itemForm.productId,
      });

      showToast("Item added successfully");
      resetItemForm();
    } catch (error) {
      console.error("Error adding item:", error);
      showToast(getErrorMessage(error, "Failed to add item"), "danger");
    } finally {
      setSavingItem(false);
    }
  };

  const handleProductImageChange = (file) => {
    const problem = getImageError(file);
    if (problem) return showToast(problem, "danger");

    revokePreview(productPreviewRef);
    const url = URL.createObjectURL(file);
    productPreviewRef.current = url;
    uploadedCategoryRef.current = null;

    setProductFile(file);
    setProductForm((prev) => ({ ...prev, image: url }));
  };

  const handleItemImageChange = (file) => {
    const problem = getImageError(file);
    if (problem) return showToast(problem, "danger");

    revokePreview(itemPreviewRef);
    const url = URL.createObjectURL(file);
    itemPreviewRef.current = url;
    uploadedItemRef.current = null;

    setItemFile(file);
    setItemForm((prev) => ({ ...prev, image: url }));
  };

  return (
    <main className={s.main}>
      <Toast
        toast={toast}
        onClose={closeToast}
        deleteLoading={Boolean(deletingCategoryId)}
      />

      <section className={s.headerSection}>
        <div className={s.headerInner}>
          <div>
            <p className={s.headerBadge}>Inventory Studio</p>
            <h1 className={s.headerTitle}>Add Categories & Items</h1>
            <p className={s.headerDescription}>
              Create categories first, then add sellable items under the
              selected category.
            </p>
          </div>
          <label className={s.searchWrapper}>
            <Search className={s.searchIcon} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories"
              className={s.searchInput}
            />
          </label>
        </div>
      </section>

      <section className={s.twoColumns}>
        <div className={s.leftColumn}>
          <h2 className={s.columnTitle}>
            <PackagePlus className={s.columnIcon} />
            Add Categories
          </h2>
          <div className={s.categoryForm}>
            <Field
              label="Category Name"
              icon={PackagePlus}
              value={productForm.name}
              onChange={(event) =>
                setProductForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              placeholder="Example: Dairy, Bread & Eggs"
            />
            <ImageUpload
              label="Category Image"
              value={productForm.image}
              onChange={handleProductImageChange}
            />
            <ActionButton
              icon={savingProduct ? Loader2 : editingProductId ? Save : Plus}
              onClick={saveProduct}
              disabled={savingProduct}
              className={s.categoryActionButton}
            >
              {savingProduct
                ? editingProductId
                  ? "Saving..."
                  : "Adding..."
                : editingProductId
                ? "Save Category"
                : "Add Category"}
            </ActionButton>
            {editingProductId && (
              <button
                type="button"
                onClick={resetProductForm}
                disabled={savingProduct}
                className="mt-2 text-sm underline opacity-70 hover:opacity-100"
              >
                Cancel editing
              </button>
            )}
          </div>

          <div className={s.categoryList}>
            {filteredCategories.map((category) => (
              <article key={category._id} className={s.categoryItem}>
                {category.image?.url ? (
                  <Image
                    src={category.image.url}
                    alt={category.categoryName}
                    className={s.categoryItemImage}
                    width={100}
                    height={100}
                  />
                ) : (
                  <ImageIcon className={s.uploadPlaceholderIcon} />
                )}

                <div className={s.categoryItemInfo}>
                  <h3 className={s.categoryItemName}>
                    {category.categoryName}
                  </h3>
                  <p className={s.categoryItemSubtext}>Category</p>
                </div>

                <button
                  type="button"
                  onClick={() => editProduct(category)}
                  aria-label={`Edit ${category.categoryName}`}
                  className={s.categoryEditButton}
                >
                  <Edit3 className={s.iconSm} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    askDelete(category.categoryName, () =>
                      handleDeleteCategory(category._id)
                    )
                  }
                  aria-label={`Delete ${category.categoryName}`}
                  className={s.categoryDeleteButton}
                >
                  <Trash2 className={s.iconSm} />
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className={s.rightColumn}>
          <h2 className={s.columnTitle}>
            <Plus className={s.columnIcon} />
            Add Item
          </h2>
          <div className={s.itemForm}>
            <label className={s.itemSelectLabel}>
              <span className={s.fieldLabel}>Select Category</span>
              <select
                value={itemForm.productId}
                onChange={(event) =>
                  setItemForm((prev) => ({
                    ...prev,
                    productId: event.target.value,
                  }))
                }
                className={s.itemSelect}
              >
                <option value="" className={s.itemSelectOption}>
                  Choose category
                </option>
                {categories.map((category) => (
                  <option
                    key={category._id}
                    value={category.categoryName}
                    className={s.itemSelectOption}
                  >
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </label>

            <div className={s.itemImageUploadWrapper}>
              <ImageUpload
                label="Item Image"
                value={itemForm.image}
                onChange={handleItemImageChange}
              />
            </div>

            <Field
              label="Item Name"
              value={itemForm.name}
              onChange={(event) =>
                setItemForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Peak Milk"
            />
            <Field
              label="Company Name"
              value={itemForm.company}
              onChange={(event) =>
                setItemForm((prev) => ({
                  ...prev,
                  company: event.target.value,
                }))
              }
              placeholder="FrieslandCampina"
            />
            <Field
              label="Size / Weight / Packet"
              value={itemForm.size}
              onChange={(event) =>
                setItemForm((prev) => ({ ...prev, size: event.target.value }))
              }
              placeholder="500 g / 1 L / 6 pcs"
            />
            <Field
              label="Original Price (optional)"
              icon={Banknote}
              value={itemForm.originalPrice}
              onChange={(event) =>
                setItemForm((prev) => ({
                  ...prev,
                  originalPrice: event.target.value,
                }))
              }
              placeholder="1200"
              type="number"
              min="0"
              step="any"
            />
            <Field
              label="Selling Price"
              icon={Banknote}
              value={itemForm.sellingPrice}
              onChange={(event) =>
                setItemForm((prev) => ({
                  ...prev,
                  sellingPrice: event.target.value,
                }))
              }
              placeholder="1000"
              type="number"
              min="0"
              step="any"
            />
            <ActionButton
              icon={savingItem ? Loader2 : Plus}
              onClick={saveItem}
              disabled={savingItem}
              className={s.itemActionButton}
            >
              {savingItem ? "Adding..." : "Add Item"}
            </ActionButton>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AddItemsPage;
