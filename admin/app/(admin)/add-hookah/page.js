"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  Tag,
  Weight,
  Package,
  Building,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Loader2,
  Banknote,
} from "lucide-react";
import { createHookah, uploadImage } from "@/app/api/adminApi.js";
import { addHookahPageStyles as s } from "@/app/assets/dummyStyles.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; 
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EMPTY_FORM = {
  name: "",
  company: "",
  selling: "",
  original: "",
  weight: "",
};

const InputField = ({
  icon: Icon,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  prefix,
  ...props
}) => (
  <div className={s.inputFieldWrapper}>
    <label htmlFor={props.name} className={s.inputFieldLabel}>
      {Icon && <Icon className={s.inputFieldIcon} />}
      {label}
    </label>

    <div className={s.inputFieldInner}>
      {prefix && <span className={s.inputFieldPrefix}>{prefix}</span>}
      <input
        id={props.name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        className={`${s.inputFieldInput} ${
          prefix ? s.inputFieldInputWithPrefix : ""
        }`}
        {...props}
      />
    </div>
  </div>
);

const page = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [form, setForm] = useState(EMPTY_FORM);

  const toastTimer = useRef(null);
  const uploadedRef = useRef(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ show: true, message, type });
    toastTimer.current = setTimeout(
      () => setToast((current) => ({ ...current, show: false })),
      3000
    );
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const processFile = (file) => {
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return showToast("Only JPG, PNG or WebP images are allowed.", "error");
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return showToast("Image must be 5MB or smaller.", "error");
    }

    setImage(file);
    uploadedRef.current = null;

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleImage = (e) => processFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    processFile(e.dataTransfer.files?.[0]);
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    uploadedRef.current = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = form.name.trim();
    const company = form.company.trim();
    const weight = form.weight.trim();
    const selling = Number(form.selling);
    const original = Number(form.original);

    if (
      !name ||
      !company ||
      !weight ||
      form.selling === "" ||
      form.original === "" ||
      !image
    ) {
      return showToast("Please fill all fields and upload an image.", "error");
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
      setIsSubmitting(true);

      if (uploadedRef.current?.file !== image) {
        const imageData = await uploadImage(image);
        uploadedRef.current = { file: image, image: imageData.image };
      }
      const { url, public_id } = uploadedRef.current.image;

      await createHookah({
        image: { url, public_id },
        name,
        company,
        sellingPrice: selling,
        oldPrice: original,
        size: weight,
      });

      showToast("Hookah added successfully");
      setForm(EMPTY_FORM);
      removeImage();
    } catch (error) {
      console.log(error);
      showToast(
        error.response?.data?.message ||
          error.message ||
          "Failed to add hookah.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={s.mainContainer}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        
        /* Override browser autofill background */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #000 inset !important;
          -webkit-text-fill-color: #fff !important;
          background-color: #000 !important;
          background: #000 !important;
        }
        input:-moz-autofill {
          background-color: #000 !important;
          color: #fff !important;
        }
        
        .card-glow {
          box-shadow: 0 25px 50px -12px rgba(255, 215, 0, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.03);
        }
        .toast-animate {
          animation: slideDown 0.3s ease-out forwards;
        }
        @keyframes slideDown {
          0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .btn-glow {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          box-shadow: 0 8px 24px -6px rgba(251, 191, 36, 0.4);
        }
        .btn-glow:hover {
          box-shadow: 0 12px 32px -6px rgba(251, 191, 36, 0.6);
          transform: translateY(-2px) scale(1.02);
        }
        .upload-area {
          background: radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.03), transparent 70%);
        }
      `}</style>

      {toast.show && (
        <div
          role="status"
          className={`${s.toastBase} ${
            toast.type === "success" ? s.toastSuccess : s.toastError
          } toast-animate`}
        >
          {toast.type === "success" ? (
            <CheckCircle className={s.toastIconSuccess} />
          ) : (
            <AlertCircle className={s.toastIconError} />
          )}
          <span className={s.toastMessage}>{toast.message}</span>
        </div>
      )}

      <div className={s.card}>
        <div className={s.decoGlow1} />
        <div className={s.decoGlow2} />

        <div className={s.header}>
          <h1 className={s.heading}>
            <span className={s.headingHighlight}>Add</span> Hookah
          </h1>
          <div className={s.headerBadge}>
            <Package className={s.headerBadgeIcon} />
            <span className={s.headerBadgeText}>New Arrival</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          <div>
            <label className={s.uploadLabel}>Hookah Image</label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`${s.uploadAreaBase} ${
                preview ? s.uploadAreaWithPreview : s.uploadAreaEmpty
              }`}
            >
              {preview ? (
                <div className={s.uploadPreviewContainer}>
                  <Image
                    src={preview}
                    className={s.uploadPreviewImage}
                    alt="hookah image"
                    width={100}
                    height={100}
                    unoptimized
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                    aria-label="Remove image"
                    className={s.removeImageButton}
                  >
                    <X className={s.iconSm} />
                  </button>
                </div>
              ) : (
                <label className={s.uploadLabelInner}>
                  <div className={s.uploadIconWrapper}>
                    <Upload className={s.uploadIcon} />
                  </div>

                  <p className={s.uploadText}>
                    <span className={s.uploadTextHighlight}>
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className={s.uploadSubtext}>PNG, JPG, WEBP (max 5MB)</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImage}
                    className={s.hiddenInput}
                  />
                </label>
              )}
            </div>
          </div>

          <div className={s.fieldsGrid}>
            <InputField
              icon={Tag}
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Pharaoh's Crown"
            />
            <InputField
              icon={Weight}
              label="Weight / Size"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              placeholder="e.g. 1 set (15 mm)"
            />
            <InputField
              icon={Banknote}
              label="Selling Price"
              type="number"
              name="selling"
              value={form.selling}
              onChange={handleChange}
              placeholder="15000"
              prefix="₦"
              min="0"
              step="any"
            />
            <InputField
              icon={Banknote}
              label="Original Price"
              type="number"
              name="original"
              value={form.original}
              onChange={handleChange}
              placeholder="20000"
              prefix="₦"
              min="0"
              step="any"
            />
          </div>

          <div>
            <label htmlFor="company" className={s.companyLabel}>
              <Building className={s.companyIcon} /> Company Name
            </label>
            <input
              id="company"
              type="text"
              name="company"
              value={form.company}
              onChange={handleChange}
              autoComplete="off"
              placeholder="e.g. Hookah Masters LLC"
              className={s.companyInput}
            />
          </div>

          <div className={s.submitWrapper}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${s.submitButton} btn-glow`}
            >
              {isSubmitting ? (
                <Loader2 className={`${s.submitIcon} animate-spin`} />
              ) : (
                <ArrowRight className={s.submitIcon} />
              )}
              <span>{isSubmitting ? "Adding..." : "Add Hookah"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default page;
