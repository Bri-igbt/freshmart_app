"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Package,
  Building,
  Weight,
  CheckCircle,
  AlertCircle,
  Camera,
  Loader2,
} from "lucide-react";
import {
  getHookahs,
  updateHookah,
  deleteHookah,
  uploadImage,
} from "@/app/api/adminApi.js";
import { hookahListPageStyles as s } from "@/app/assets/dummyStyles.js";
import Image from "next/image.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const formatNaira = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`;

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const page = () => {
  const [hookahs, setHookahs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const objectUrlRef = useRef(null);
  const toastTimer = useRef(null);
  const uploadedRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ show: true, message, type });
    toastTimer.current = setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      2500
    );
  }, []);

  const revokePreview = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const fetchHookahs = useCallback(async () => {
    try {
      const { data } = await getHookahs();
      setHookahs(data.hookahs);
    } catch (error) {
      showToast(getErrorMessage(error, "Failed to load hookahs."), "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchHookahs();

    return () => {
      clearTimeout(toastTimer.current);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [fetchHookahs]);

  const query = search.toLowerCase().trim();
  const filtered = hookahs.filter(
    (h) =>
      h.name.toLowerCase().includes(query) ||
      h.company.toLowerCase().includes(query)
  );

  const startEdit = (h) => {
    revokePreview();
    uploadedRef.current = null;
    setEditingId(h._id);
    setEditData({ ...h });
  };

  const finishEdit = () => {
    revokePreview();
    uploadedRef.current = null;
    setEditingId(null);
    setEditData({});
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return showToast("Only JPG, PNG or WebP images are allowed.", "error");
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return showToast("Image must be 5MB or smaller.", "error");
    }

    revokePreview();
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;

    setEditData({
      ...editData,
      image: file,
      _preview: objectUrl,
    });
  };

  const saveEdit = async () => {
    const name = String(editData.name ?? "").trim();
    const company = String(editData.company ?? "").trim();
    const size = String(editData.size ?? "").trim();
    const selling = Number(editData.sellingPrice);
    const original = Number(editData.oldPrice);

    if (
      !name ||
      !company ||
      !size ||
      String(editData.sellingPrice ?? "").trim() === "" ||
      String(editData.oldPrice ?? "").trim() === ""
    ) {
      return showToast("Please fill in every field.", "error");
    }

    if (
      !Number.isFinite(selling) ||
      !Number.isFinite(original) ||
      selling < 0 ||
      original < 0
    ) {
      return showToast("Prices must be valid positive numbers.", "error");
    }

    if (original < selling) {
      return showToast(
        "Original price can't be lower than the selling price.",
        "error"
      );
    }

    try {
      setSavingId(editingId);

      const payload = {
        name,
        company,
        sellingPrice: selling,
        oldPrice: original,
        size,
      };

      if (editData.image instanceof File) {
        if (uploadedRef.current?.file !== editData.image) {
          const upload = await uploadImage(editData.image);
          uploadedRef.current = { file: editData.image, image: upload.image };
        }
        payload.image = {
          url: uploadedRef.current.image.url,
          public_id: uploadedRef.current.image.public_id,
        };
      }

      await updateHookah(editingId, payload);
      await fetchHookahs();
      finishEdit();
      showToast("Hookah updated successfully!");
    } catch (error) {
      console.error(error);
      showToast(getErrorMessage(error, "Failed to update hookah."), "error");
    } finally {
      setSavingId(null);
    }
  };

  const requestDelete = (id, name) => {
    setConfirmTarget({ id, name });
  };

  const confirmDelete = async () => {
    const { id } = confirmTarget;

    try {
      setDeletingId(id);
      await deleteHookah(id);
      setHookahs((prev) => prev.filter((h) => h._id !== id));
      setConfirmTarget(null);
      showToast("Hookah deleted successfully!");
    } catch (error) {
      console.log(error);
      showToast(getErrorMessage(error, "Failed to delete hookah."), "error");
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setConfirmTarget(null);
  };

  return (
    <div className={s.main}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        .toast-slide {
          animation: slideDown 0.25s ease-out forwards;
        }
        @keyframes slideDown {
          0% { opacity: 0; transform: translateY(-16px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        input, select {
          background: #000 !important;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #000 inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>

      {toast.show && (
        <div
          role="status"
          className={`${s.toastBase} ${
            toast.type === "success" ? s.toastSuccess : s.toastError
          } toast-slide`}
        >
          {toast.type === "success" ? (
            <CheckCircle className={s.toastIcon} />
          ) : (
            <AlertCircle className={s.toastIcon} />
          )}
          <span className={s.toastMessage}>{toast.message}</span>
        </div>
      )}

      {confirmTarget && (
        <div className={s.confirmModal} role="alertdialog" aria-modal="true">
          <div className={s.confirmInner}>
            <AlertCircle className={s.confirmIcon} />
            <div className="flex-1">
              <p className={s.confirmTitle}>
                Delete &quot;{confirmTarget.name}&quot;?
              </p>
              <p className={s.confirmSubtext}>This action cannot be undone.</p>
              <div className={s.confirmActions}>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deletingId === confirmTarget.id}
                  className={s.confirmDeleteButton}
                >
                  {deletingId === confirmTarget.id && (
                    <Loader2 className={`${s.confirmSpinner} animate-spin`} />
                  )}
                  {deletingId === confirmTarget.id ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={deletingId === confirmTarget.id}
                  className={s.confirmCancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={s.headerWrapper}>
        <div className={s.headerLeft}>
          <Package className={s.headerIcon} />
          <h1 className={s.headerTitle}>
            <span className={s.headerHighlight}>Hookah</span> Collection
          </h1>
          <span className={s.headerBadge}>{filtered.length} items</span>
        </div>

        <div className={s.searchWrapper}>
          <Search className={s.searchIcon} />
          <input
            type="text"
            placeholder="Search by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={s.searchInput}
          />
        </div>
      </div>

      <div className={s.grid}>
        {filtered.map((h) => {
          const isEditing = editingId === h._id;
          const data = isEditing ? editData : h;
          const imageSrc = isEditing
            ? data._preview || data.image?.url
            : h.image?.url;

          return (
            <div key={h._id} className={s.card}>
              <div className={s.imageContainer}>
                <Image
                  src={imageSrc || undefined}
                  alt={data.name || h.name}
                  loading="lazy"
                  className={s.cardImage}
                  width={100}
                  height={100}
                />
                {isEditing && (
                  <label className={s.imageOverlay}>
                    <Camera className={s.imageOverlayIcon} />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className={s.hiddenInput}
                    />
                    <span className={s.imageOverlayText}>Change image</span>
                  </label>
                )}
              </div>

              <div className={s.cardContent}>
                {isEditing ? (
                  <>
                    <input
                      name="name"
                      value={data.name ?? ""}
                      onChange={handleEditChange}
                      className={s.editInputName}
                    />
                    <input
                      name="company"
                      value={data.company ?? ""}
                      onChange={handleEditChange}
                      className={s.editInputCompany}
                    />
                    <div className={s.editPriceRow}>
                      <input
                        name="sellingPrice"
                        type="number"
                        min="0"
                        step="any"
                        value={data.sellingPrice ?? ""}
                        onChange={handleEditChange}
                        className={s.editInputSelling}
                      />
                      <input
                        name="oldPrice"
                        type="number"
                        min="0"
                        step="any"
                        value={data.oldPrice ?? ""}
                        onChange={handleEditChange}
                        className={s.editInputOld}
                      />
                    </div>
                    <input
                      name="size"
                      value={data.size ?? ""}
                      onChange={handleEditChange}
                      className={s.editInputSize}
                    />
                    <div className={s.editActions}>
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={savingId === h._id}
                        className={s.editSaveButton}
                      >
                        {savingId === h._id ? (
                          <Loader2
                            className={`${s.editButtonIcon} animate-spin`}
                          />
                        ) : (
                          <Save className={s.editButtonIcon} />
                        )}
                        {savingId === h._id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={finishEdit}
                        disabled={savingId === h._id}
                        className={s.editCancelButton}
                      >
                        <X className={s.editButtonIcon} /> Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className={s.itemName}>{h.name}</h3>
                    <p className={s.itemCompany}>
                      <Building className={s.itemIcon} /> {h.company}
                    </p>
                    <div className={s.itemPriceRow}>
                      <span className={s.itemSellingPrice}>
                        {formatNaira(h.sellingPrice)}
                      </span>
                      <span className={s.itemOldPrice}>
                        {formatNaira(h.oldPrice)}
                      </span>
                    </div>
                    <p className={s.itemSize}>
                      <Weight className={s.itemIcon} />
                      {h.size}
                    </p>
                    <div className={s.itemActions}>
                      <button
                        type="button"
                        onClick={() => startEdit(h)}
                        className={s.itemEditButton}
                      >
                        <Edit className={s.itemButtonIcon} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(h._id, h.name)}
                        className={s.itemDeleteButton}
                      >
                        <Trash2 className={s.itemButtonIcon} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className={s.emptyState}>
          <Loader2 className={`${s.emptyIcon} animate-spin`} />
          <p className={s.emptyTitle}>Loading hookahs...</p>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className={s.emptyState}>
          <Package className={s.emptyIcon} />
          <p className={s.emptyTitle}>No hookahs found</p>
          <p className={s.emptySubtext}>Try adjusting your search</p>
        </div>
      )}
    </div>
  );
};

export default page;
