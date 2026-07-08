import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import axios from "axios";
import { API_BASE_URL } from "./config";
import AnnouncementEditor from "./announcementEditor";
import Select from "react-select";
import { useCart } from "../context/CartContext";
const getAdminHeaders = () => {
  const token = localStorage.getItem("adminToken");
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
};



const AdminPage = () => {
  const navigate = useNavigate();
  const location = useLocation();


   // ✅ State declarations
  const [products, setProducts] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [manageSort, setManageSort] = useState("latest");
  const [uploadSearch, setUploadSearch] = useState("");
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("add");
  const tabContentRef = useRef(null);
  // 🏷️ Brand states
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandLogo, setNewBrandLogo] = useState(null);
  const [brands, setBrands] = useState([]);
  // 🏷️ Bulk brand upload states
const [brandFiles, setBrandFiles] = useState([]);
const [brandUploading, setBrandUploading] = useState(false);
const [brandMessage, setBrandMessage] = useState("");
// 🏷️ Brand edit states
const [editingBrandId, setEditingBrandId] = useState(null);
const [editingBrandName, setEditingBrandName] = useState("");
const [updatingBrand, setUpdatingBrand] = useState(false);


  const [adminUser, setAdminUser] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subSubcategories, setSubSubcategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState('');
  const [newSubSubcategoryName, setNewSubSubcategoryName] = useState('');
  const [selectedParentSubcategoryForSubSub, setSelectedParentSubcategoryForSubSub] = useState('');
  const [adminOrders, setAdminOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('all');
  const [announcement, setAnnouncement] = useState("");
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // Multiple announcements management
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncementText, setNewAnnouncementText] = useState("");
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [editingAnnouncementText, setEditingAnnouncementText] = useState("");
  const [announcementSettings, setAnnouncementSettings] = useState({ displayDuration: 5000, gapDuration: 1000 });
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);

  // Announcements helpers
  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/settings/announcements`);
      if (res.data?.success) {
        setAnnouncements(res.data.announcements || []);
        if (res.data.settings) {
          setAnnouncementSettings({
            displayDuration: res.data.settings.displayDuration || 5000,
            gapDuration: res.data.settings.gapDuration || 1000,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return showToast('⚠️ Please enter announcement text', 'warn');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/settings/announcements`, { text: newAnnouncementText }, { headers: getAdminHeaders() });
      if (res.data && res.data.success) {
        showToast('✅ Announcement added', 'success');
        setNewAnnouncementText('');
        fetchAnnouncements();
        try { window.dispatchEvent(new Event('announcements-updated')); } catch {}
      }
    } catch (err) {
      console.error('Add announcement failed', err);
      showToast('❌ Failed to add announcement', 'error');
    }
  };

  const startEditAnnouncement = (ann) => {
    setEditingAnnouncementId(ann.id);
    setEditingAnnouncementText(ann.text);
  };

  const saveEditAnnouncement = async (id) => {
    if (!editingAnnouncementText.trim()) return showToast('⚠️ Please enter announcement text', 'warn');
    try {
      const res = await axios.put(`${API_BASE_URL}/api/settings/announcements/${id}`, { text: editingAnnouncementText }, { headers: getAdminHeaders() });
      if (res.data && res.data.success) {
        showToast('✅ Announcement updated', 'success');
        setEditingAnnouncementId(null);
        setEditingAnnouncementText('');
        fetchAnnouncements();
        try { window.dispatchEvent(new Event('announcements-updated')); } catch {}
      }
    } catch (err) {
      console.error('Update announcement failed', err);
      showToast('❌ Failed to update announcement', 'error');
    }
  };

  const deleteAnnouncement = (id) => {
    askConfirm('Are you sure you want to delete this announcement?', async () => {
      try {
        await axios.delete(`${API_BASE_URL}/api/settings/announcements/${id}`, { headers: getAdminHeaders() });
        showToast('✅ Announcement deleted', 'success');
        fetchAnnouncements();
        try { window.dispatchEvent(new Event('announcements-updated')); } catch {}
      } catch (err) {
        console.error('Delete announcement failed', err);
        showToast('❌ Failed to delete announcement', 'error');
      }
    });
  };

  const saveAnnouncementSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        showToast('⚠️ Please login as admin before saving settings', 'error');
        return;
      }
      const payload = {
        displayDuration: Number(announcementSettings.displayDuration) || 5000,
        gapDuration: Number(announcementSettings.gapDuration) || 1000
      };
      const res = await axios.put(`${API_BASE_URL}/api/settings/announcements/settings`, payload, { headers: getAdminHeaders() });
      if (res.data && res.data.success) {
        showToast('✅ Announcement settings saved', 'success');
        fetchAnnouncements();
        try { window.dispatchEvent(new Event('announcements-updated')); } catch {}
      }
    } catch (err) {
      console.error('Save announcement settings failed', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to save settings';
      showToast(`❌ ${msg}`, 'error');
    }
  };
  

    // 📝 About Page States
const [aboutContent, setAboutContent] = useState("");
const [savingAbout, setSavingAbout] = useState(false);
// 👔 Careers Page States
const [careersContent, setCareersContent] = useState("");
const [savingCareers, setSavingCareers] = useState(false);

// 🔹 Category → Subcategory → Products flow
const [selectedCategory, setSelectedCategory] = useState(null);
const [selectedSubcategory, setSelectedSubcategory] = useState(null);

// 🔍 Search states
const [subcategorySearch, setSubcategorySearch] = useState("");
const [productSearch, setProductSearch] = useState("");

// 📦 Products under selected subcategory
const [subcategoryProducts, setSubcategoryProducts] = useState([]);


  // 🎭 Tags Management States
  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tagSlugInput, setTagSlugInput] = useState("");
  const [tagImageFile, setTagImageFile] = useState(null);
  const [tagImagePreview, setTagImagePreview] = useState(null);
  const [addingTag, setAddingTag] = useState(false);
  const [tagMessage, setTagMessage] = useState("");
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTagId, setEditingTagId] = useState(null); // 🎭 For editing tags
  const [bulkBulkFile, setBulkBulkFile] = useState(null); // 🎭 For bulk upload
  const [bulkTagsLoading, setBulkTagsLoading] = useState(false); // 🎭 Bulk loading state
  const fileInputRef = useRef(null); // 🎭 Ref for file input
  const bulkFileInputRef = useRef(null); // 🎭 Ref for bulk file input

  // 🏬 Stores Management States
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [savingStore, setSavingStore] = useState(false);
  const [storeMessage, setStoreMessage] = useState('');
  const [storeForm, setStoreForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    image_url: '',
    open_hours: ''
  });
  const [storeImageFile, setStoreImageFile] = useState(null);
  const [storeImagePreview, setStoreImagePreview] = useState(null);
  
  // Popup
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', kind: 'success' });
  const showToast = (message, kind = 'success', duration = 1200) => {
    setToast({ show: true, message, kind });
    setTimeout(() => setToast({ show: false, message: '', kind }), duration);
  };
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: '',
    onConfirm: null,
  });
  const askConfirm = (message, onConfirm) => {
    setConfirmState({ open: true, message, onConfirm });
  };
  const handleConfirmYes = () => {
    const fn = confirmState.onConfirm;
    setConfirmState({ open: false, message: '', onConfirm: null });
    if (typeof fn === 'function') fn();
  };
  const handleConfirmNo = () => {
    setConfirmState({ open: false, message: '', onConfirm: null });
  };

  
// Bulk upload states (for products)
const [bulkFile, setBulkFile] = useState(null);
const [bulkMessage, setBulkMessage] = useState("");
const [bulkLoading, setBulkLoading] = useState(false);
const [acceptedReportUrl, setAcceptedReportUrl] = useState(null);
const [rejectedReportUrl, setRejectedReportUrl] = useState(null);
const [acceptedRowsPreview, setAcceptedRowsPreview] = useState([]);
const [rejectedRowsPreview, setRejectedRowsPreview] = useState([]);

// 📊 Upload History states
const [uploadHistory, setUploadHistory] = useState([]);
const [uploadHistoryLoading, setUploadHistoryLoading] = useState(false);
const [uploadHistoryPage, setUploadHistoryPage] = useState(1);
const [uploadHistoryTotal, setUploadHistoryTotal] = useState(0);

// Bulk delete states
const [deleteFile, setDeleteFile] = useState(null);
const [deleteMessage, setDeleteMessage] = useState("");
const [deleteLoading, setDeleteLoading] = useState(false);
const [deletedReportUrl, setDeletedReportUrl] = useState(null);
const [notFoundReportUrl, setNotFoundReportUrl] = useState(null);
const [deletedRowsPreview, setDeletedRowsPreview] = useState([]);
const [notFoundRowsPreview, setNotFoundRowsPreview] = useState([]);

// 📊 Fetch upload history
const fetchUploadHistory = async (page = 1) => {
  try {
    setUploadHistoryLoading(true);
    const url = `${API_BASE_URL}/api/upload-history?page=${page}&limit=10`;
    console.log('📊 Fetching upload history from:', url);
    
    const res = await fetch(url);
    const data = await res.json();
    
    console.log('📊 Upload history response:', data);
    
    if (data.success) {
      setUploadHistory(data.uploads || []);
      setUploadHistoryPage(page);
      setUploadHistoryTotal(data.pagination?.totalRecords || 0);
      console.log('✅ Upload history loaded:', data.uploads?.length, 'records');
    } else {
      console.error('❌ Upload history failed:', data.message);
    }
  } catch (err) {
    console.error('❌ Error fetching upload history:', err);
  } finally {
    setUploadHistoryLoading(false);
  }
};

// Fetch upload history on component mount
useEffect(() => {
  fetchUploadHistory(1);
}, []);

// 📥 Download report file
const downloadReportFile = (reportType, reportName) => {
  const url = `${API_BASE_URL}/api/upload-report/${reportType}`;
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Delete an upload record
const deleteUploadRecord = (uploadId) => {
  const token = localStorage.getItem('adminToken');
  if (!token) return showToast('⚠️ Please login as admin to delete records', 'error');

  askConfirm('Are you sure you want to delete this upload record? This will remove it from the database.', async () => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/upload-history/${uploadId}`, { headers: getAdminHeaders() });
      if (res.data && res.data.success) {
        showToast('✅ Upload record deleted', 'success');
        // refresh current page
        fetchUploadHistory(uploadHistoryPage);
      } else {
        showToast(res.data?.message || '❌ Failed to delete record', 'error');
      }
    } catch (err) {
      console.error('Delete upload record failed:', err);
      showToast('❌ Failed to delete upload record', 'error');
    }
  });
};

// Handle bulk product upload (Excel/CSV/TXT)
const handleBulkProductUpload = async (e) => {
  e.preventDefault();

  if (!bulkFile) {
    setBulkMessage("⚠️ Please select a file first.");
    return;
  }

  const token = localStorage.getItem('adminToken');
  if (!token) {
    setBulkMessage('⚠️ Access denied. Please login as admin before uploading.');
    return;
  }

  const formData = new FormData();
  formData.append("file", bulkFile);

  try {
    setBulkLoading(true);
    setBulkMessage("Uploading... ⏳");
    setAcceptedReportUrl(null);
    setRejectedReportUrl(null);

    const response = await axios.post(
      `${API_BASE_URL}/api/upload-excel`,
      formData,
      { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } }
    );

    if (response.data && response.data.success) {
      const totalRows = response.data.totalRows ?? response.data.total ?? 0;
      const saved = response.data.savedCount ?? response.data.inserted ?? 0;
      const updated = response.data.updatedCount ?? response.data.updated ?? 0;
      const rejected = response.data.rejectedCount ?? response.data.rejected ?? 0;
      const acceptedRows = response.data.acceptedRows ?? [
        ...(response.data.insertedProducts || []),
        ...(response.data.updatedProducts || [])
      ];
      const rejectedRows = response.data.rejectedRows ?? response.data.unprocessedProducts ?? [];
      const totalSaved = acceptedRows.length;

      setBulkMessage(`✅ Processed ${totalRows} rows. New saved: ${saved}, Updated: ${updated}, Rejected: ${rejected}`);
      setAcceptedReportUrl(response.data.acceptedFileUrl);
      setRejectedReportUrl(response.data.rejectedFileUrl);
      setAcceptedRowsPreview(acceptedRows);
      setRejectedRowsPreview(rejectedRows);
      // Refresh product list if any saved/updated
      if (totalSaved > 0) fetchProducts();
      // Refresh upload history
      console.log('📊 Refreshing upload history after upload...');
      setTimeout(() => fetchUploadHistory(1), 500);
    } else {
      setBulkMessage('⚠️ Import completed with issues');
    }
  } catch (error) {
    console.error('Bulk import error:', error);
    // Show more actionable message on auth failure
    if (error?.response?.status === 401 || error?.response?.data?.message === 'Access denied. No token provided') {
      setBulkMessage('⚠️ Access denied. Please login as admin and retry.');
    } else {
      const msg = error?.response?.data?.message || '❌ Upload failed';
      setBulkMessage(msg);
    }
  } finally {
    setBulkLoading(false);
  }
};

// Handle bulk delete by product codes
const handleBulkDeleteUpload = async (e) => {
  e.preventDefault();

  if (!deleteFile) {
    setDeleteMessage("⚠️ Please select a file first.");
    return;
  }

  const token = localStorage.getItem('adminToken');
  if (!token) {
    setDeleteMessage('⚠️ Access denied. Please login as admin before uploading.');
    return;
  }

  const formData = new FormData();
  formData.append("file", deleteFile);

  try {
    setDeleteLoading(true);
    setDeleteMessage("Deleting... ⏳");
    setDeletedReportUrl(null);
    setNotFoundReportUrl(null);

    const response = await axios.post(
      `${API_BASE_URL}/api/bulk-delete`,
      formData,
      { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } }
    );

    if (response.data && response.data.success) {
      setDeleteMessage(`✅ Deleted ${response.data.deletedCount} products. Not found: ${response.data.notFoundCount}`);
      setDeletedReportUrl(response.data.deletedFileUrl);
      setNotFoundReportUrl(response.data.notFoundFileUrl);
      setDeletedRowsPreview(response.data.deletedRows || []);
      setNotFoundRowsPreview(response.data.notFoundRows || []);
      if ((response.data.deletedCount || 0) > 0) fetchProducts();
    } else {
      setDeleteMessage('⚠️ Bulk delete completed with issues');
    }
  } catch (error) {
    console.error('Bulk delete error:', error);
    if (error?.response?.status === 401) {
      setDeleteMessage('⚠️ Access denied. Please login as admin and retry.');
    } else {
      const msg = error?.response?.data?.message || '❌ Delete failed';
      setDeleteMessage(msg);
    }
  } finally {
    setDeleteLoading(false);
  }
};



// 🏷️ Handle brand file selection
const handleBrandFilesChange = (e) => {
  const files = Array.from(e.target.files || []);
  setBrandFiles(files);
};


 // ✅ Billing state
  const [billItems, setBillItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedBillingProduct, setSelectedBillingProduct] = useState("");
  const [billingQuantity, setBillingQuantity] = useState(1);
  // Quick add to bag quantities per product in Manage tab
  const [quickAddQty, setQuickAddQty] = useState({});
  
  // New product form state
 const [newProduct, setNewProduct] = useState({
  product_name: '',
  product_price: '',
  product_brand: '',
  product_description: "",
  product_code: "",
  age_range: '',
  gender: '',
  specifications: '',
  product_details: '',
  brand_name: '',
  product_highlights: '',
  category_id: '',
  subcategory_id: '',
  sub_subcategory_id: '',
  stock_quantity: '',
  discount: '',
  mrp: ''

});

  const [newProductImages, setNewProductImages] = useState([]);
  
  // Edit stock state
  const [editingProductId, setEditingProductId] = useState(null);
  const [editStockValue, setEditStockValue] = useState('');

useEffect(() => {
  const verifyAndLoadAdmin = async () => {
    setIsVerifying(true);

    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      localStorage.removeItem("adminUser");
      navigate("/admin/login", { replace: true });
      setIsVerifying(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/verify`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!res.ok) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login", { replace: true });
        setIsVerifying(false);
        return;
      }

      const data = await res.json();
      if (!data?.success || !data?.admin) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login", { replace: true });
        setIsVerifying(false);
        return;
      }

      setAdminUser(data.admin);
      localStorage.setItem("adminUser", JSON.stringify(data.admin));

      fetchProducts();
      fetchTags();
      if (typeof fetchStores === 'function') fetchStores();
    } catch (error) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      navigate("/admin/login", { replace: true });
    } finally {
      setIsVerifying(false);
    }
  };

  verifyAndLoadAdmin();
}, [navigate]);




//const [categories, setCategories] = useState([]);
//const [subcategories, setSubcategories] = useState([]);
const fetchCategories = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories`);
    const data = await res.json();
    setCategories(data);
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
};

useEffect(() => {
  fetchCategories();
}, []);

const handleCategoryChange = (e) => {
  const categoryId = e.target.value;
  setNewProduct({ ...newProduct, category_id: categoryId, subcategory_id: '', sub_subcategory_id: '' });
  setSubSubcategories([]);

  if (!categoryId) {
    setSubcategories([]);
    return;
  }

  // fetch subcategories
  fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategories`)
    .then(res => res.json())
    .then(data => setSubcategories(data));
};

const handleSubcategoryChange = (e) => {
  const subcategoryId = e.target.value;
  setNewProduct({ ...newProduct, subcategory_id: subcategoryId, sub_subcategory_id: '' });
  setSubSubcategories([]);

  if (!subcategoryId || !newProduct.category_id) return;

  fetch(`${API_BASE_URL}/api/categories/${newProduct.category_id}/subcategories/${subcategoryId}/sub-subcategories`)
    .then(res => res.json())
    .then(data => setSubSubcategories(data.subSubcategories || []));
};

// Add category & subcategory handlers
const handleAddCategory = async (e) => {
  e.preventDefault();
  if (!newCategoryName.trim()) return showToast('⚠️ Category name required', 'error');
  const token = localStorage.getItem('adminToken');
  if (!token) return showToast('⚠️ Please login as admin', 'error');
  try {
    const res = await axios.post(`${API_BASE_URL}/api/categories`, { category_name: newCategoryName.trim() }, { headers: { Authorization: `Bearer ${token}` } });
    if (res.data?.success) {
      showToast('✅ Category added');
      setNewCategoryName('');
      fetchCategories();
      window.dispatchEvent(new Event('categories-updated'));
    } else {
      showToast(res.data?.message || 'Failed to add category', 'error');
    }
  } catch (err) {
    const msg = err?.response?.data?.message || 'Failed to add category';
    showToast(msg, 'error');
  }
};

const handleAddSubcategory = async (e) => {
  e.preventDefault();
  if (!selectedParentCategoryId) return showToast('⚠️ Select parent category', 'error');
  if (!newSubcategoryName.trim()) return showToast('⚠️ Subcategory name required', 'error');
  const token = localStorage.getItem('adminToken');
  if (!token) return showToast('⚠️ Please login as admin', 'error');
  try {
    const res = await axios.post(`${API_BASE_URL}/api/subcategories`, { subcategory_name: newSubcategoryName.trim(), category_id: selectedParentCategoryId }, { headers: { Authorization: `Bearer ${token}` } });
    if (res.data?.success) {
      showToast('✅ Subcategory added');
      setNewSubcategoryName('');
      // If the added subcategory belongs to currently selected category in new product form, refresh subcategories
      if (newProduct.category_id === selectedParentCategoryId) {
        fetch(`${API_BASE_URL}/api/categories/${selectedParentCategoryId}/subcategories`)
          .then(res => res.json())
          .then(data => setSubcategories(data));
      }
      window.dispatchEvent(new Event('categories-updated'));
      // refresh local list too
      fetchSubcategories();
    } else {
      showToast(res.data?.message || 'Failed to add subcategory', 'error');
    }
  } catch (err) {
    const msg = err?.response?.data?.message || 'Failed to add subcategory';
    showToast(msg, 'error');
  }
};

const handleAddSubSubcategory = async (e) => {
  e.preventDefault();
  if (!selectedParentCategoryId) return showToast('⚠️ Select parent category', 'error');
  if (!selectedParentSubcategoryForSubSub) return showToast('⚠️ Select parent subcategory', 'error');
  if (!newSubSubcategoryName.trim()) return showToast('⚠️ Sub-subcategory name required', 'error');
  const token = localStorage.getItem('adminToken');
  if (!token) return showToast('⚠️ Please login as admin', 'error');
  try {
    const res = await axios.post(`${API_BASE_URL}/api/sub-subcategories`, { sub_subcategory_name: newSubSubcategoryName.trim(), category_id: selectedParentCategoryId, subcategory_id: selectedParentSubcategoryForSubSub }, { headers: { Authorization: `Bearer ${token}` } });
    if (res.data?.success) {
      showToast('✅ Sub-subcategory added');
      setNewSubSubcategoryName('');
      fetchSubSubcategories();
      window.dispatchEvent(new Event('categories-updated'));
    } else {
      showToast(res.data?.message || 'Failed to add sub-subcategory', 'error');
    }
  } catch (err) {
    const msg = err?.response?.data?.message || 'Failed to add sub-subcategory';
    showToast(msg, 'error');
  }
};

// Categories management: additional state & helpers
const [showCategoriesPanel, setShowCategoriesPanel] = useState(false);
const [categoriesSearch, setCategoriesSearch] = useState('');
const [allSubcategories, setAllSubcategories] = useState([]);
const [allSubSubcategories, setAllSubSubcategories] = useState([]);
const [editing, setEditing] = useState(null); // { type: 'category'|'subcategory', id }
const [editName, setEditName] = useState('');
const [editParentCategoryId, setEditParentCategoryId] = useState('');
const [editParentSubcategoryId, setEditParentSubcategoryId] = useState('');
const [loadingCategoryAction, setLoadingCategoryAction] = useState(false);

const fetchSubcategories = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/subcategories`);
    const data = await res.json();
    setAllSubcategories(data);
  } catch (err) {
    console.error('Error fetching subcategories:', err);
  }
};
const fetchSubSubCategories = async (subcategoryId) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/sub-subcategories/${subcategoryId}`
    );

    const data = await res.json();
    setSubSubCategories(data);
  } catch (err) {
    console.error("Error fetching sub subcategories:", err);
  }
};

const fetchSubSubcategories = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sub-subcategories`);
    const data = await res.json();
    setAllSubSubcategories(data);
  } catch (err) {
    console.error('Error fetching sub-subcategories:', err);
  }
};

useEffect(() => {
  // refresh subcategories when panel opens
  if (showCategoriesPanel) fetchSubcategories();
  if (showCategoriesPanel) fetchSubSubcategories();
}, [showCategoriesPanel]);

// When user navigates to the Categories tab, refresh lists
useEffect(() => {
  if (activeTab === 'categories') {
    fetchCategories();
    fetchSubcategories();
    fetchSubSubcategories();
    setCategoriesSearch('');
  }
}, [activeTab]);

// Start edit
const startEdit = (type, item) => {
  setEditing({ type, id: item.id });
  setEditName(item.name || '');
  setEditParentCategoryId(item.category_id || '');
  setEditParentSubcategoryId(item.subcategory_id || '');
};

const cancelEdit = () => {
  setEditing(null);
  setEditName('');
  setEditParentCategoryId('');
};

const saveEdit = async () => {
  if (!editing) return;
  const token = localStorage.getItem('adminToken');
  if (!token) return showToast('⚠️ Please login as admin', 'error');

  setLoadingCategoryAction(true);
  try {
    if (editing.type === 'category') {
      const res = await axios.put(`${API_BASE_URL}/api/categories/${editing.id}`, { category_name: editName }, { headers: getAdminHeaders() });
      if (res.data?.success) {
        showToast('✅ Category updated');
      } else {
        showToast(res.data?.message || 'Failed to update category', 'error');
      }
    } else if (editing.type === 'subcategory') {
      const res = await axios.put(`${API_BASE_URL}/api/subcategories/${editing.id}`, { subcategory_name: editName, category_id: editParentCategoryId }, { headers: getAdminHeaders() });
      if (res.data?.success) {
        showToast('✅ Subcategory updated');
      } else {
        showToast(res.data?.message || 'Failed to update subcategory', 'error');
      }
    }
    else if (editing.type === 'subsub') {
      const res = await axios.put(`${API_BASE_URL}/api/sub-subcategories/${editing.id}`, { sub_subcategory_name: editName, category_id: editParentCategoryId, subcategory_id: editParentSubcategoryId }, { headers: getAdminHeaders() });
      if (res.data?.success) {
        showToast('✅ Sub-subcategory updated');
      } else {
        showToast(res.data?.message || 'Failed to update sub-subcategory', 'error');
      }
    }

    // Refresh lists
    fetchCategories();
    fetchSubcategories();
    fetchSubSubcategories();
    window.dispatchEvent(new Event('categories-updated'));
    cancelEdit();
  } catch (err) {
    const msg = err?.response?.data?.message || 'Failed to save';
    showToast(msg, 'error');
  } finally {
    setLoadingCategoryAction(false);
  }
};

const deleteItem = async (type, id) => {
  const token = localStorage.getItem('adminToken');
  if (!token) return showToast('⚠️ Please login as admin', 'error');
  try {
    if (type === 'category') {
      const res = await axios.delete(`${API_BASE_URL}/api/categories/${id}`, { headers: getAdminHeaders() });
      if (res.data?.success) showToast('✅ Category deleted'); else showToast(res.data?.message || 'Failed to delete', 'error');
    } else {
      if (type === 'subsubcategory' || type === 'subsub') {
        const res = await axios.delete(`${API_BASE_URL}/api/sub-subcategories/${id}`, { headers: getAdminHeaders() });
        if (res.data?.success) showToast('✅ Sub-subcategory deleted'); else showToast(res.data?.message || 'Failed to delete', 'error');
      } else {
        const res = await axios.delete(`${API_BASE_URL}/api/subcategories/${id}`, { headers: getAdminHeaders() });
        if (res.data?.success) showToast('✅ Subcategory deleted'); else showToast(res.data?.message || 'Failed to delete', 'error');
      }
    }
    fetchCategories();
    fetchSubcategories();
    fetchSubSubcategories();
    window.dispatchEvent(new Event('categories-updated'));
  } catch (err) {
    const msg = err?.response?.data?.message || 'Failed to delete';
    showToast(msg, 'error');
  }
};

// 📦 Fetch products by subcategory
const fetchProductsBySubcategory = async (subcategoryId) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/products?subcategory_id=${subcategoryId}`
    );
    const data = await res.json();

    if (Array.isArray(data)) {
      setSubcategoryProducts(data);
    } else if (Array.isArray(data.products)) {
      setSubcategoryProducts(data.products);
    } else {
      setSubcategoryProducts([]);
    }
  } catch (err) {
    console.error('Error fetching products by subcategory:', err);
    setSubcategoryProducts([]);
  }
};






  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      // Add timestamp to force fresh data from server
      const response = await fetch(
  `${API_BASE_URL}/api/products?showAll=true&t=${Date.now()}`,
  {
    headers: getAdminHeaders(),
  }
);

      const data = await response.json();
      
      // if (data.success) {
      //   setProducts(data.products);
      //   // console.log('Products loaded:', data.products);
      // } else {
      //   setMessage('Failed to load products');
      // }
      if (Array.isArray(data)) {
  setProducts(data);
} else if (data.success && Array.isArray(data.products)) {
  setProducts(data.products);
} else {
  setProducts([]);
  setMessage("No products found");
}

    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('Error connecting to server. Make sure backend is running.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      setSelectedFiles([]);
      setMessage('');
      return;
    }

    const MAX_FILES = 5;
    let infoMessage = '';

    if (files.length > MAX_FILES) {
      infoMessage = `You can upload a maximum of ${MAX_FILES} images at a time.`;
    }

    const selected = files.slice(0, MAX_FILES);
    const oversized = selected.find((file) => file.size > 2 * 1024 * 1024);

    if (oversized) {
      setMessage('Each image must be less than 2MB.');
      e.target.value = '';
      setSelectedFiles([]);
      return;
    }

    setSelectedFiles(selected);
    setMessage(infoMessage);
  };

  // Delete a single image from selected files
  const handleDeleteSingleImage = (indexToDelete) => {
    const updatedFiles = selectedFiles.filter((_, index) => index !== indexToDelete);
    setSelectedFiles(updatedFiles);
    
    // Reset file input
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
    
    if (updatedFiles.length === 0) {
      setMessage('');
    }
  };

  // Delete all selected images
  const handleDeleteAllImages = () => {
    setSelectedFiles([]);
    setMessage('');
    
    // Reset file input
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
  };

  const handleProductSelect = (e) => {
    setSelectedProductId(e.target.value);
    setMessage('');
  };
const handleDownloadExcel = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/export`, {
      headers: getAdminHeaders(),
    });
    if (!response.ok) throw new Error('Failed to download products');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download products error:', err);
    showToast('❌ Failed to download products', 'error');
  }
};
  // 🚀 Bulk upload images by product_code (filename)
const handleBulkImageUpload = async (e) => {
  e.preventDefault();

  if (selectedFiles.length === 0) {
    setMessage("⚠️ Please select images for bulk upload");
    return;
  }

  setLoading(true);
  const formData = new FormData();
  selectedFiles.forEach((file) => {
    formData.append("images", file);
  });

  try {
    const res = await fetch(`${API_BASE_URL}/api/products/bulk-images`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showToast("✅ Bulk images uploaded successfully!", "success", 1600);
      setSelectedFiles([]);
      setMessage("");
      document.getElementById("file-input").value = "";
      fetchProducts();
    } else {
      setMessage(data.message || "❌ Bulk upload failed");
    }
  } catch (err) {
    console.error("Bulk upload error:", err);
    showToast("❌ Error in bulk upload", "error", 1600);
  } finally {
    setLoading(false);
  }
};


  const handleUpload = async (e) => {
    e.preventDefault();

   if (selectedFiles.length === 0 || !selectedProductId) {
  setMessage('Please select a product for single upload, or use Bulk Upload.');
  return;
}


    setLoading(true);
    const formData = new FormData();
    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file) => formData.append('images', file));
      formData.append('primaryImageIndex', '0');
    }
    try {
     const response = await fetch(`${API_BASE_URL}/api/products/${selectedProductId}/images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`
        },
        body: formData,
      });

      // const data = await response.json();

      let responseBody = '';
      let data = '' ;  

      try {
        responseBody = await response.text();
        data = responseBody ? JSON.parse(responseBody) : null;
      } catch (parseError) {
        console.warn('Unable to parse upload response as JSON:', parseError);
      }

      if (response.ok && data?.success) {
        setPopupMessage('Image uploaded successfully!');
        setShowPopup(true);
        // Hide popup after 1 seconds
        setTimeout(() => setShowPopup(false), 1000);
        setSelectedFiles([]);
        setSelectedProductId('');
        setMessage('');
        // Refresh products
        fetchProducts();
        // Reset file input
        document.getElementById('file-input').value = '';
      } else {
        const errorMessage = data?.message || responseBody || 'Failed to upload image';
        setMessage(errorMessage);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Error uploading image', 'error', 1600);
    } finally {
      setLoading(false);
    }
  };

  // Handle new product form changes
  const handleNewProductChange = (e) => {
    setNewProduct({
      ...newProduct,
      [e.target.name]: e.target.value,
    });
  };

  const handleNewProductImageChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      setNewProductImages([]);
      setMessage('');
      return;
    }

    const MAX_FILES = 5;
    let infoMessage = '';

    if (files.length > MAX_FILES) {
      infoMessage = `You can upload a maximum of ${MAX_FILES} images per product.`;
    }

    const selectedFiles = files.slice(0, MAX_FILES);
    const oversized = selectedFiles.find((file) => file.size > 2 * 1024 * 1024);

    if (oversized) {
      setMessage('Each image must be less than 2MB.');
      e.target.value = '';
      setNewProductImages([]);
      return;
    }

    setNewProductImages(selectedFiles);
    setMessage(infoMessage);
  };

 const handleAddProduct = async (e) =>{
  e.preventDefault();
  setLoading(true);

  try {
    const formData = new FormData();
      formData.append('name', newProduct.product_name);
      formData.append('product_code', newProduct.product_code || '');
    formData.append('description', newProduct.product_description || '');
    formData.append('price', newProduct.product_price);
    formData.append('category_id', newProduct.category_id || null);
    formData.append('subcategory_id', newProduct.subcategory_id || null);
    if (newProduct.sub_subcategory_id) {
      formData.append('sub_subcategory_id', newProduct.sub_subcategory_id);
    }
    formData.append('stock_quantity', newProduct.stock_quantity || 0);
    formData.append('age_range', newProduct.age_range || '');
    formData.append('gender', newProduct.gender || '');
    formData.append('highlights', newProduct.product_highlights || '');
    formData.append('specifications', newProduct.specifications || '');
    formData.append('product_details', newProduct.product_details || '');
    formData.append('brand_name', newProduct.brand_name || '');
    formData.append('mrp', newProduct.mrp);
    formData.append('discount', newProduct.discount);


    if (newProductImages.length > 0) {
      newProductImages.forEach((file) => {
        formData.append('images', file);
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Failed to add product');

    showToast('✅ Product added successfully!', 'success', 1200);
    setNewProduct({
      product_name: '',
      product_code: '',
      product_price: '',
      product_brand: '',
      product_description: '',
      age_range: '',
      gender: '',
      specifications: '',
      product_details: '',
      sub_subcategory_id: '',
      brand_name: '',
      product_highlights: '',
      category_id: '',
      subcategory_id: '',
      stock_quantity: '',
      discount: '',
      mrp: ''
    });
    setNewProductImages([]);
    document.getElementById('product_image').value = '';
    fetchProducts();
  } catch (error) {
    console.error('Error adding product:', error);
    showToast('❌ Error adding product: ' + error.message, 'error', 1600);
  } finally {
    setLoading(false);
  }
};

// 🏷️ Fetch brands
const fetchBrands = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/brands`);
    const data = await res.json();

    // ✅ Always set array
    if (Array.isArray(data)) {
      setBrands(data);
    } else if (Array.isArray(data.brands)) {
      setBrands(data.brands);
    } else {
      console.warn("Unexpected brands response:", data);
      setBrands([]);
    }
  } catch (err) {
    console.error("Failed to fetch brands", err);
    setBrands([]);
  }
};





// 🏷️ Bulk brand upload
const handleBulkBrandUpload = async (e) => {
  e.preventDefault();

  if (brandFiles.length === 0) {
    setBrandMessage("⚠️ Please select brand logo files");
    return;
  }

  try {
    setBrandUploading(true);
    setBrandMessage("Uploading brands...");

    const formData = new FormData();
    brandFiles.forEach((file) => {
      formData.append("logos", file);
    });

    // ✅ FIXED ENDPOINT
    const res = await fetch(`${API_BASE_URL}/api/brands/bulk`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      setBrandMessage(`✅ ${data.message}`);
      setBrandFiles([]);
      fetchBrands();
    } else {
      setBrandMessage(data.message || "❌ Upload failed");
    }
  } catch (err) {
    console.error(err);
    setBrandMessage("❌ Error uploading brands");
  } finally {
    setBrandUploading(false);
  }
};

// 🎭 TAGS MANAGEMENT FUNCTIONS
const fetchTags = async () => {
  try {
    setLoadingTags(true);
    const res = await fetch(`${API_BASE_URL}/api/tags`);
    const data = await res.json();
    if (data.success) {
      setTags(data.tags || []);
    }
  } catch (err) {
    console.error("Error fetching tags:", err);
    showToast("❌ Failed to fetch tags", 'error');
  } finally {
    setLoadingTags(false);
  }
};

const handleAddTag = async (e) => {
  e.preventDefault();
  if (!tagInput.trim()) {
    showToast("⚠️ Please enter a tag name", 'warn');
    return;
  }

  try {
    setAddingTag(true);
    const authToken = localStorage.getItem("adminToken");
    
    // 🎭 Handle both add and edit
    if (editingTagId) {
      // UPDATE existing tag
      const formData = new FormData();
      formData.append('name', tagInput.trim());
      formData.append('slug', tagSlugInput.trim() || tagInput.trim().toLowerCase().replace(/\s+/g, '-'));
      if (tagImageFile && typeof tagImageFile === 'object' && tagImageFile.type) {
        formData.append('image', tagImageFile);
      }
      
      const res = await fetch(`${API_BASE_URL}/api/tags/${editingTagId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        showToast(`✅ Tag "${tagInput}" updated successfully!`, 'success');
        setTagInput("");
        setTagSlugInput("");
        setTagImageFile(null);
        setTagImagePreview(null);
        setEditingTagId(null);
        setShowTagForm(false);
        fetchTags();
      } else {
        showToast(`❌ ${data.message || "Failed to update tag"}`, 'error');
      }
    } else {
      // CREATE new tag
      const formData = new FormData();
      formData.append('name', tagInput.trim());
      formData.append('slug', tagSlugInput.trim() || tagInput.trim().toLowerCase().replace(/\s+/g, '-'));
      if (tagImageFile) {
        formData.append('image', tagImageFile);
      }
      
      const res = await fetch(`${API_BASE_URL}/api/tags`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        showToast(`✅ Tag "${tagInput}" added successfully!`, 'success');
        setTagInput("");
        setTagSlugInput("");
        setTagImageFile(null);
        setTagImagePreview(null);
        setShowTagForm(false);
        fetchTags();
      } else {
        showToast(`❌ ${data.message || "Failed to add tag"}`, 'error');
      }
    }
  } catch (err) {
    console.error("Error saving tag:", err);
    showToast("❌ Error saving tag", 'error');
  } finally {
    setAddingTag(false);
  }
};

const handleTagImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      showToast("❌ Image size must be less than 5MB", 'error');
      return;
    }
    
    setTagImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setTagImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }
};

const handleDeleteTag = (tagId, tagName) => {
  askConfirm(
    `Are you sure you want to delete the tag "${tagName}"? Products with this tag will still exist but won't have this tag assigned.`,
    async () => {
      try {
        const authToken = localStorage.getItem("adminToken");
        
        const res = await fetch(`${API_BASE_URL}/api/tags/${tagId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        });

        const data = await res.json();

        if (data.success) {
          showToast(`✅ Tag "${tagName}" deleted successfully!`, 'success');
          fetchTags();
        } else {
          showToast(`❌ ${data.message || "Failed to delete tag"}`, 'error');
        }
      } catch (err) {
        console.error("Error deleting tag:", err);
        showToast("❌ Error deleting tag", 'error');
      }
    }
  );
};

// 🎭 Handle Edit Tag
const handleEditTag = (tag) => {
  setEditingTagId(tag.id);
  setTagInput(tag.name);
  setTagSlugInput(tag.slug);
  setTagImagePreview(tag.image ? `${API_BASE_URL}${tag.image}` : null);
  setShowTagForm(true);
  // Scroll to form
  setTimeout(() => {
    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
};

// 🎭 Handle Bulk Upload
const handleBulkUpload = async () => {
  if (!bulkBulkFile) {
    showToast("❌ Please select a file", 'error');
    return;
  }

  try {
    setBulkTagsLoading(true);
    const formData = new FormData();
    formData.append('file', bulkBulkFile);

    const authToken = localStorage.getItem("adminToken");
    const res = await fetch(`${API_BASE_URL}/api/tags/bulk-upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      showToast(`✅ ${data.message || "Tags uploaded successfully!"}`, 'success');
      setBulkBulkFile(null);
      bulkFileInputRef.current.value = '';
      fetchTags();
    } else {
      showToast(`❌ ${data.message || "Failed to upload tags"}`, 'error');
    }
  } catch (err) {
    console.error("Error uploading bulk tags:", err);
    showToast("❌ Error uploading tags", 'error');
  } finally {
    setBulkTagsLoading(false);
  }
};

// 🎭 Download Excel Template
const downloadExcelTemplate = () => {
  const csvContent = `name,slug,image_url
Marvel,marvel,/uploads/tags/marvel.jpg
DC,dc,/uploads/tags/dc.jpg
Disney Princess,disney-princess,/uploads/tags/disney.jpg
Harry Potter,harry-potter,/uploads/tags/harry.jpg`;
  
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
  element.setAttribute("download", "tags_template.csv");
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

// 🏬 Stores Management - functions
const fetchStores = async () => {
  try {
    setLoadingStores(true);
    const res = await fetch(`${API_BASE_URL}/api/stores`);
    const data = await res.json();
    if (data && data.stores) setStores(data.stores);
    else setStores([]);
  } catch (err) {
    console.error('Error fetching stores:', err);
    showToast('❌ Failed to fetch stores', 'error');
    setStores([]);
  } finally {
    setLoadingStores(false);
  }
};

const handleStoreChange = (e) => {
  const { name, value } = e.target;
  setStoreForm({ ...storeForm, [name]: value });
};

const handleStoreImageChange = (e) => {
  const file = e.target.files?.[0] || null;
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      showToast('❌ Image must be less than 10MB', 'error');
      return;
    }
    setStoreImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setStoreImagePreview(reader.result);
    reader.readAsDataURL(file);
  } else {
    setStoreImageFile(null);
    setStoreImagePreview(null);
  }
};

const uploadStoreImage = async (storeId) => {
  if (!storeImageFile) return null;
  try {
    const authToken = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('image', storeImageFile);
    const res = await fetch(`${API_BASE_URL}/api/stores/${storeId}/image`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: formData
    });
    const data = await res.json();
    if (data.success && data.image_url) {
      return data.image_url;
    } else {
      showToast(`❌ ${data.message || 'Failed to upload image'}`, 'error');
      return null;
    }
  } catch (err) {
    console.error('Upload store image error', err);
    showToast('❌ Error uploading image', 'error');
    return null;
  }
};

const handleEditStore = (store) => {
  setEditingStoreId(store.id);
  setStoreForm({
    name: store.name || '',
    address: store.address || '',
    city: store.city || '',
    state: store.state || '',
    postal_code: store.postal_code || '',
    phone: store.phone || '',
    email: store.email || '',
    latitude: store.latitude || '',
    longitude: store.longitude || '',
    image_url: store.image_url || '',
    open_hours: store.open_hours || ''
  });
  // show existing image as preview if available
  if (store.image_url) {
    setStoreImagePreview(store.image_url.startsWith('http') ? store.image_url : `${API_BASE_URL}${store.image_url}`);
  } else {
    setStoreImagePreview(null);
  }
  setStoreImageFile(null);
  setShowStoreForm(true);
  setTimeout(() => { document.querySelector('.tab-content form')?.scrollIntoView({ behavior: 'smooth' }); }, 100);
};

const handleDeleteStore = (storeId, storeName) => {
  askConfirm(`Are you sure you want to delete the store "${storeName}"?`, async () => {
    try {
      const authToken = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/stores/${storeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Store "${storeName}" deleted`, 'success');
        fetchStores();
      } else {
        showToast(`❌ ${data.message || 'Failed to delete store'}`, 'error');
      }
    } catch (err) {
      console.error('Delete store error:', err);
      showToast('❌ Error deleting store', 'error');
    }
  });
};

const handleStoreSubmit = async (e) => {
  e.preventDefault();
  if (!storeForm.name?.trim()) { showToast('⚠️ Name is required', 'warn'); return; }
  try {
    setSavingStore(true);
    const authToken = localStorage.getItem('adminToken');
    const method = editingStoreId ? 'PUT' : 'POST';
    const url = editingStoreId ? `${API_BASE_URL}/api/stores/${editingStoreId}` : `${API_BASE_URL}/api/stores`;
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(storeForm)
    });
    const data = await res.json();

    if (data.success) {
      // If image file present, upload it after creating/updating store
      let storeId = editingStoreId || data.storeId || data.storeId || data.insertId;
      // some endpoints return insertId or storeId; try to infer
      if (!storeId && !editingStoreId && data.storeId) storeId = data.storeId;

      if (!storeId) {
        // For update, we already know editingStoreId
        storeId = editingStoreId;
      }

      if (storeImageFile && storeId) {
        const uploaded = await uploadStoreImage(storeId);
        if (uploaded) {
          showToast('✅ Image uploaded', 'success');
          setStoreForm({ ...storeForm, image_url: uploaded });
        }
      }

      showToast(editingStoreId ? '✅ Store updated' : '✅ Store created', 'success');
      setStoreForm({ name: '', address: '', city: '', state: '', postal_code: '', phone: '', email: '', latitude: '', longitude: '', image_url: '', open_hours: '' });
      setStoreImageFile(null);
      setStoreImagePreview(null);
      setShowStoreForm(false);
      setEditingStoreId(null);
      fetchStores();
    } else {
      showToast(`❌ ${data.message || 'Failed to save store'}`, 'error');
    }
  } catch (err) {
    console.error('Save store error:', err);
    showToast('❌ Error saving store', 'error');
  } finally {
    setSavingStore(false);
  }
};

// Gift Card States
const [newGiftCard, setNewGiftCard] = useState({
  title: '',
  brand: '',
  sku: '',
  base_price: '',
  price_options: '',
  description: ''
});
const [giftCardImages, setGiftCardImages] = useState([]);

// Handle form input changes
const handleGiftCardChange = (e) => {
  setNewGiftCard({ ...newGiftCard, [e.target.name]: e.target.value });
};

// Handle image change
const handleGiftCardImageChange = (e) => {
  const files = Array.from(e.target.files || []);
  const valid = files.filter(f => f.size <= 2 * 1024 * 1024);
  if (valid.length !== files.length) {
    showToast("Each image must be less than 2MB", 'warn', 1600);
  }
  setGiftCardImages(valid);
};

// Handle Gift Card submit
const handleAddGiftCard = async (e) => {
  e.preventDefault();
  if (!giftCardImages || giftCardImages.length === 0) {
    showToast("Please upload at least one image", 'warn', 1600);
    return;
  }

  try {
    setLoading(true);
    const formData = new FormData();
    formData.append("title", newGiftCard.title);
    formData.append("brand", newGiftCard.brand);
    formData.append("sku", newGiftCard.sku);
    formData.append("base_price", newGiftCard.base_price);
    formData.append("price_options", newGiftCard.price_options);
    formData.append("description", newGiftCard.description);
    giftCardImages.forEach((file) => formData.append("images", file));

    const response = await axios.post(`${API_BASE_URL}/api/giftcards`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (response.data.success) {
      showToast("🎁 Gift Card added successfully!", 'success', 1200);
      setNewGiftCard({
        title: '',
        brand: '',
        sku: '',
        base_price: '',
        price_options: '',
        description: ''
      });
      setGiftCardImages([]);
      // Refresh available gift cards below
      fetchGiftCards();
    } else {
      showToast(response.data.message || "Failed to add gift card", 'error', 1600);
    }
  } catch (error) {
    console.error("Gift Card Error:", error);
    showToast("Error adding gift card", 'error', 1600);
  } finally {
    setLoading(false);
  }
};


// 🎁 Manage Gift Cards State
const [giftCards, setGiftCards] = useState([]);
const [loadingGiftCards, setLoadingGiftCards] = useState(false);

// Fetch all gift cards
const fetchGiftCards = async () => {
  try {
    setLoadingGiftCards(true);
    const response = await axios.get(`${API_BASE_URL}/api/giftcards`);
    if (response.data.success) {
      setGiftCards(response.data.giftcards);
    } else {
      console.error("Failed to fetch gift cards");
    }
  } catch (error) {
    console.error("Error fetching gift cards:", error);
  } finally {
    setLoadingGiftCards(false);
  }
};

// Delete a gift card
const handleDeleteGiftCard = (id) => {
  askConfirm("Are you sure you want to delete this gift card?", async () => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/giftcards/${id}`);
      if (response.data.success) {
        showToast("Gift Card deleted successfully!", 'success', 1200);
        fetchGiftCards();
      } else {
        showToast(response.data.message || "Failed to delete gift card", 'error', 1600);
      }
    } catch (error) {
      console.error("Error deleting gift card:", error);
      showToast("Error deleting gift card", 'error', 1600);
    }
  });
};

// Load gift cards when Add Gift Card tab is active (so list shows below form)
useEffect(() => {
  if (activeTab === "giftcard") {
    fetchGiftCards();
  }
}, [activeTab]);

// Fetch all customer orders (no admin token required)
const fetchAdminOrders = async (status = ordersStatusFilter) => {
  setLoadingOrders(true);
  setOrdersError("");
  try {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_BASE_URL}/api/orders${query}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned invalid response. Please check the server logs.');
    }

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || `Failed to load orders: ${res.status} ${res.statusText}`);
    }
    
    setAdminOrders(Array.isArray(data.orders) ? data.orders : []);
  } catch (err) {
    console.error('Error fetching orders:', err);
    setOrdersError(err.message || 'Unable to fetch orders right now.');
  } finally {
    setLoadingOrders(false);
  }
};

// Load orders when Orders tab becomes active
useEffect(() => {
  if (activeTab === 'orders') {
    fetchAdminOrders();
  }
}, [activeTab]);

// Load brands when brands tab becomes active

useEffect(() => {
  if (activeTab === "brands") {
    fetchBrands();
  }
}, [activeTab]);




// Refetch when filter changes while on orders tab
useEffect(() => {
  if (activeTab === 'orders') {
    fetchAdminOrders(ordersStatusFilter);
  }
}, [ordersStatusFilter]);
useEffect(() => {
  setSelectedSubcategory(null);
  setSubcategoryProducts([]);
  setSubcategorySearch('');
  setProductSearch('');
}, [selectedCategory]);



const handleAcceptOrder = (orderId) => {
  askConfirm('Are you sure you want to accept this order?', async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned invalid response. Please check the server logs.');
      }

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || `Failed to accept order: ${res.status} ${res.statusText}`);
      }
      
      showToast('✅ Order accepted successfully! Status changed from pending to accepted.', 'success', 2000);
      // Refresh orders to show updated status
      fetchAdminOrders();
    } catch (err) {
      console.error('Error accepting order:', err);
      showToast(err.message || 'Could not accept the order. Please try again later.', 'error', 2000);
    }
  });
};

const handleCancelOrder = (orderId) => {
  askConfirm('Are you sure you want to cancel this order?', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.success) {
        showToast('Order cancelled successfully!', 'success', 2000);
        fetchAdminOrders(); // refresh list
      } else {
        showToast(data.message || 'Failed to cancel order', 'error', 2000);
      }
    } catch (err) {
      console.error("Cancel error:", err);
      showToast('Something went wrong while cancelling the order', 'error', 2000);
    }
  });
};


  // Logout function
  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout) return;

    try {
      const adminToken = localStorage.getItem('adminToken');
      
      if (adminToken) {
        await fetch(`${API_BASE_URL}/api/admin/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      try {
        window.dispatchEvent(new Event('user-changed'));
      } catch {
        // ignore
      }

      navigate('/', { replace: true });
    }
  };

  // Update stock quantity
  const handleUpdateStock = async (productId) => {
    if (!editStockValue || editStockValue < 0) {
      setMessage('Please enter a valid stock quantity');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock_quantity: parseInt(editStockValue) }),
      });

      const data = await response.json();

      if (data.success) {
         // Set popup instead of just message
        setPopupMessage(`✅ Stock updated successfully to ${editStockValue} units!`);
        setShowPopup(true);

        // Hide popup after 2 seconds
      setTimeout(() => setShowPopup(false), 2000);

        setEditingProductId(null);
        setEditStockValue('');
        fetchProducts();
      } else {
        setMessage(data.message || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Update stock error:', error);
      setMessage('Error updating stock');
    }
  };

  const startEditingStock = (productId, currentStock) => {
    setEditingProductId(productId);
    setEditStockValue(currentStock);
  };

  const cancelEditingStock = () => {
    setEditingProductId(null);
    setEditStockValue('');
  };

  // Delete product
  const handleDeleteProduct = (productId) => {
    askConfirm('Are you sure you want to delete this product?', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          showToast('Product deleted successfully!', 'success', 1200);
          fetchProducts();
        } else {
          showToast(data.message || 'Failed to delete product', 'error', 1600);
        }
      } catch (error) {
        console.error('Delete error:', error);
        showToast('Error deleting product', 'error', 1600);
      }
    });
  };

    // Delete Brand Logo

//   const handleDeleteBrand = async (brandId) => {
//   askConfirm("Are you sure you want to delete this brand?", async () => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
//         },
//       });

//       const data = await res.json();

//       if (data.success) {
//         showToast("Brand deleted successfully!", "success", 1200);
//         fetchBrands(); // refresh brand list
//       } else {
//         showToast(data.message || "Failed to delete brand", "error", 1600);
//       }
//     } catch (err) {
//       console.error("Delete brand error:", err);
//       showToast("Error deleting brand", "error", 1600);
//     }
//   });
// };


const handleDeleteBrand = (brandId) => {
  askConfirm("Are you sure you want to delete this brand?", async () => {
    try {
      const adminToken = localStorage.getItem("adminToken");

      if (!adminToken) {
        showToast("Admin session expired. Please login again.", "error", 1600);
       navigate('/admin-login');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }

      showToast("✅ Brand deleted successfully!", "success", 1200);
      fetchBrands();
    } catch (err) {
      console.error("Delete brand error:", err);
      showToast(err.message || "Error deleting brand", "error", 1600);
    }
  });
};

// 🏷️ Handle edit brand name
const handleEditBrand = (brand) => {
  setEditingBrandId(brand.id);
  setEditingBrandName(brand.name);
};

// 🏷️ Handle save brand name
const handleSaveBrandName = async (brandId) => {
  if (!editingBrandName.trim()) {
    showToast("⚠️ Brand name cannot be empty", "error", 1200);
    return;
  }

  try {
    setUpdatingBrand(true);
    const adminToken = localStorage.getItem("adminToken");

    if (!adminToken) {
      showToast("Admin session expired. Please login again.", "error", 1600);
      navigate('/admin-login');
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: editingBrandName.trim() }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Update failed");
    }

    showToast("✅ Brand name updated successfully!", "success", 1200);
    setEditingBrandId(null);
    setEditingBrandName("");
    fetchBrands();
  } catch (err) {
    console.error("Update brand error:", err);
    showToast(err.message || "Error updating brand", "error", 1600);
  } finally {
    setUpdatingBrand(false);
  }
};

// 🏷️ Handle cancel edit
const handleCancelEditBrand = () => {
  setEditingBrandId(null);
  setEditingBrandName("");
};


  // Delete product image
  const handleDeleteProductImage = (productId) => {
    askConfirm('Are you sure you want to delete this image?', async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}/image`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          showToast('Image deleted successfully!', 'success', 1200);
          fetchProducts();
        } else {
          showToast(data.message || 'Failed to delete image', 'error', 1600);
        }
      } catch (error) {
        console.error('Delete image error:', error);
        showToast('Error deleting image', 'error', 1600);
      } finally {
        setLoading(false);
      }
    });
  };

  // Billing functions
  const handleAddToBill = () => {
    if (!selectedBillingProduct || billingQuantity <= 0) {
      setMessage('Please select a product and enter quantity');
      return;
    }

    const product = products.find(p => p.id === parseInt(selectedBillingProduct));
    if (!product) {
      setMessage('Product not found');
      return;
    }

    if (billingQuantity > product.stock_quantity) {
      setMessage(`Only ${product.stock_quantity} items available in stock`);
      return;
    }

    // Check if product already in bill
    const existingItemIndex = billItems.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity
      const updatedItems = [...billItems];
      updatedItems[existingItemIndex].quantity += billingQuantity;
      setBillItems(updatedItems);
    } else {
      // Add new item
      setBillItems([...billItems, {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: billingQuantity,
      }]);
    }

    setSelectedBillingProduct('');
    setBillingQuantity(1);
    setMessage('');
  };

  // Quick add to bag from Manage tab card
  const handleQuickAddToBill = (productId) => {
    const qty = parseInt(quickAddQty[productId] ?? 1, 10);
    if (!qty || qty <= 0) {
      setMessage('Please enter a valid quantity');
      return;
    }

    const product = products.find(p => p.id === parseInt(productId));
    if (!product) {
      setMessage('Product not found');
      return;
    }

    if (qty > product.stock_quantity) {
      setMessage(`Only ${product.stock_quantity} items available in stock`);
      return;
    }

   addToCart(
  {
    id: product.id,
    name: product.name,
    price: parseFloat(product.price),
    image: product.image || "", // optional
  },
  qty
);

    setQuickAddQty(prev => ({ ...prev, [productId]: 1 }));
    setMessage('');
    setPopupMessage('Added to bag');
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 800);
  };

  const handleRemoveFromBill = (productId) => {
    setBillItems(billItems.filter(item => item.id !== productId));
  };

  const handleUpdateBillQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromBill(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock_quantity) {
      setMessage(`Only ${product.stock_quantity} items available in stock`);
      return;
    }

    setBillItems(billItems.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateBillTotal = () => {
    const subtotal = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // const gst = subtotal * 0.18;
    const total = subtotal;
    return { subtotal, total };
  };

  const handlePrintBill = () => {
    if (billItems.length === 0) {
      setMessage('Add items to the bill first');
      return;
    }

    const { subtotal, total } = calculateBillTotal();
    const billDate = new Date().toLocaleString();

    // Create print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - Kiddy Palace</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
          }
          .bill-header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .bill-info {
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f4f4f4;
          }
          .text-right {
            text-align: right;
          }
          .total-section {
            margin-left: auto;
            width: 300px;
            border-top: 2px solid #333;
            padding-top: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }
          .grand-total {
            font-weight: bold;
            font-size: 1.2em;
            border-top: 2px solid #333;
            margin-top: 10px;
            padding-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 0.9em;
          }
          @media print {
            body {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="bill-logoo">
      <div 
  class="bill-logoo" 
  style="display:flex; align-items:center; justify-content:center; text-align:center; gap:12px; width:100%;"
>
  
  <img
    src="/kp-logo copy.png"
    alt="Kiddy Palace Logo"
    style="width:70px; height:auto; display:block; margin-bottom:20px;"
  />

  <div class="header-text" style="display:flex; flex-direction:column; justify-content:center;">
    <h2 class="store-title" style="margin:0; font-size:22px;">Kiddy Palace STORE</h2>
    <p class="invoice-text" style="margin:2px 0 0; font-size:14px;">Tax Invoice</p>
  </div>

</div>
 <br>
        <div class="bill-info">
          <p><strong>Date:</strong> ${billDate}</p>
          ${customerName ? `<p><strong>Customer:</strong> ${customerName}</p>` : ''}
          ${customerPhone ? `<p><strong>Phone:</strong> ${customerPhone}</p>` : ''}
        </div>
      
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Product Name</th>
              <th class="text-right">Price (₹)</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${billItems.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td class="text-right">₹${item.price.toFixed(2)}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">₹${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>
         
          <div class="total-row grand-total">
            <span>Total Amount:</span>
            <span>₹${total.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>*** This is a computer generated invoice ***</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleClearBill = () => {
    if (billItems.length > 0 && !window.confirm('Are you sure you want to clear the bill?')) {
      return;
    }
    setBillItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setMessage('');
  };

// 🔍 Filter products for Upload tab search (by name or code)
// const filteredUploadProducts = products.filter((p) => {
//   const q = searchQuery.toLowerCase();
//   return (
//     p.name?.toLowerCase().includes(q) ||
//     p.product_code?.toLowerCase().includes(q)
//   );
// });
const filteredUploadProducts = products.filter((p) => {
  const q = uploadSearch.trim().toLowerCase();
  if (!q) return true; // show all if empty

  return (
    p.name?.toLowerCase().includes(q) ||
    p.product_code?.toLowerCase().includes(q)
  );
});

// ✅ Options for react-select in Upload tab
const uploadOptions = products.map((p) => ({
  value: p.id,
  label: `${p.product_code ? p.product_code + " - " : ""}${p.name} - ₹${p.price} (Stock: ${p.stock_quantity})`
}));

const filteredManageProducts = products.filter((p) => {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return true;
  const name = (p.name || p.product_name || "").toLowerCase();
  const code = (p.product_code || "").toLowerCase();
  return name.includes(query) || code.includes(query);
});

const sortedManageProducts = [...filteredManageProducts].sort((a, b) => {
  if (manageSort === "name_asc") {
    return (a.name || a.product_name || "").localeCompare(b.name || b.product_name || "");
  }
  if (manageSort === "name_desc") {
    return (b.name || b.product_name || "").localeCompare(a.name || a.product_name || "");
  }
  if (manageSort === "price_low") {
    return Number(a.price || 0) - Number(b.price || 0);
  }
  if (manageSort === "price_high") {
    return Number(b.price || 0) - Number(a.price || 0);
  }
  if (manageSort === "stock_low") {
    return Number(a.stock_quantity ?? 0) - Number(b.stock_quantity ?? 0);
  }
  return Number(b.id || 0) - Number(a.id || 0);
});


// 📥 Download Product Excel Template
const downloadProductTemplate = () => {
  const csvContent = `product_name,product_code,description,price,mrp,discount,brand_name,category_id,subcategory_id,stock_quantity,age_range,gender,highlights,specifications,product_details
Building Blocks Set,BB001,Colorful building blocks,499,599,10,Lego,1,2,50,3-5 Years,Unisex,Safe plastic blocks,100 pieces set,Best toy for kids
Toy Car,TC002,Remote control car,899,999,5,HotWheels,1,3,30,5-7 Years,Boys,Fast speed,Rechargeable battery,Durable design`;

  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent)
  );
  element.setAttribute("download", "product_template.csv");
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const validAdminTabs = [
  'add',
  'upload',
  'manage',
  'billing',
  'giftcard',
  'orders',
  'announcement',
  'brands',
  'tags',
  'stores',
  'about',
  'careers',
  'categories',
  'bulkUploadHistory',
];

const switchAdminTab = (tab, afterSwitch) => {
  if (!validAdminTabs.includes(tab)) return;

  setActiveTab(tab);
  if (typeof afterSwitch === 'function') afterSwitch();

  const params = new URLSearchParams(location.search);
  params.set('tab', tab);
  navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: false });

  requestAnimationFrame(() => {
    tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};

useEffect(() => {
  const params = new URLSearchParams(location.search);
  const tab = params.get('tab');
  if (tab && validAdminTabs.includes(tab) && tab !== activeTab) {
    setActiveTab(tab);
  }
}, [location.search, activeTab]);

if (isVerifying) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">
      Verifying admin session...
    </div>
  );
}


  return (
    <div className="admin-page flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-emerald-50 text-slate-900 [&_button]:inline-flex [&_button]:min-h-[40px] [&_button]:items-center [&_button]:justify-center [&_button]:whitespace-nowrap [&_button]:align-middle [&_input]:w-full [&_select]:w-full [&_textarea]:w-full [&_input]:rounded-xl [&_select]:rounded-xl [&_textarea]:rounded-xl [&_input]:border-slate-200 [&_select]:border-slate-200 [&_textarea]:border-slate-200 [&_.tab-navigation]:grid [&_.tab-navigation]:grid-cols-2 [&_.tab-navigation]:gap-3 sm:[&_.tab-navigation]:grid-cols-3 lg:[&_.tab-navigation]:grid-cols-4 xl:[&_.tab-navigation]:grid-cols-6 2xl:[&_.tab-navigation]:grid-cols-8 [&_.tab-btn]:w-full [&_.tab-btn]:min-h-[56px] [&_.tab-btn]:rounded-2xl [&_.tab-btn]:px-3 [&_.tab-btn]:py-3 [&_.tab-btn]:text-[13px] [&_.tab-btn]:font-semibold [&_.tab-btn]:normal-case [&_.tab-btn]:tracking-normal [&_.tab-btn]:leading-tight [&_.tab-btn]:text-center [&_.tab-btn]:shadow-sm [&_.tab-btn]:transition [&_.tab-btn:hover]:shadow-md">
      <Header />
      <main
  className="
    w-full
    px-4

    xl:px-8
    2xl:px-10

    [@media(min-width:1920px)]:px-20
  "
>
        <div className="admin-container mx-auto w-full max-w-[1300px] xl:max-w-[1720px] 2xl:max-w-[1860px]">
          <div className="admin-header mb-6 rounded-3xl border border-white/60 bg-gradient-to-r from-[#2e79e3] to-[#1d5fb8] px-6 py-5 text-center shadow-[0_18px_40px_rgba(39,60,46,0.12)] sm:px-8">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">Admin Dashboard</h1>
              {adminUser && (
                <p className="admin-welcome mt-2 text-sm font-medium text-white/90">Welcome, {adminUser.full_name} ({adminUser.role})</p>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="tab-navigation mb-5">
  <button 
    className={`tab-btn rounded-full border border-blue-200 bg-white text-slate-700 ${activeTab === 'add' ? 'active !border-blue-500 !bg-blue-600 !text-white shadow-lg shadow-blue-200' : ''}`}
    onClick={() => switchAdminTab('add', () => setMessage(''))}
  >
    ➕ Add New Product
  </button>

  <button 
    className={`tab-btn rounded-full border border-blue-200 bg-white text-slate-700 ${activeTab === 'upload' ? 'active !border-blue-500 !bg-blue-600 !text-white shadow-lg shadow-blue-200' : ''}`}
    onClick={() => switchAdminTab('upload', () => setMessage(''))}
  >
    📸 Upload Product Images
  </button>

  <button 
    className={`tab-btn rounded-full border border-blue-200 bg-white text-slate-700 ${activeTab === 'manage' ? 'active !border-blue-500 !bg-blue-600 !text-white shadow-lg shadow-blue-200' : ''}`}
    onClick={() => switchAdminTab('manage', () => setMessage(''))}
  >
    📦 Manage Products 
  </button>

  <button 
    className={`tab-btn rounded-full border border-blue-200 bg-white text-slate-700 ${activeTab === 'billing' ? 'active !border-blue-500 !bg-blue-600 !text-white shadow-lg shadow-blue-200' : ''}`}
    onClick={() => switchAdminTab('billing', () => setMessage(''))}
  >
    💳 Billing (POS)
  </button>

  {/* ✅ New Gift Card Tab */}
  <button 
    className={`tab-btn rounded-full border border-blue-200 bg-white text-slate-700 ${activeTab === 'giftcard' ? 'active !border-blue-500 !bg-blue-600 !text-white shadow-lg shadow-blue-200' : ''}`}
    onClick={() => switchAdminTab('giftcard', () => setMessage(''))}
  >
    🎁 Add Gift Card
  </button>

  <button 
    className={`tab-btn rounded-full border border-blue-200 bg-white text-slate-700 ${activeTab === 'orders' ? 'active !border-blue-500 !bg-blue-600 !text-white shadow-lg shadow-blue-200' : ''}`}
    onClick={() => switchAdminTab('orders', () => setMessage(''))}
  >
    📬 Orders
  </button>

  <button 
  className={`tab-btn rounded-full border border-blue-200 bg-white text-slate-700 ${activeTab === 'announcement' ? 'active !border-blue-500 !bg-blue-600 !text-white shadow-lg shadow-blue-200' : ''}`}
  onClick={() => switchAdminTab('announcement')}
  >
    📢 Announcement
  </button>


  <button 
    className={`tab-btn rounded-full border border-blue-200 bg-white text-slate-700 ${activeTab === 'brands' ? 'active !border-blue-500 !bg-blue-600 !text-white shadow-lg shadow-blue-200' : ''}`}
  onClick={() => switchAdminTab('brands')}>
    Brands
  </button>

  <button  
    className={`tab-btn rounded-full border border-blue-200 bg-white text-slate-700 ${activeTab === 'tags' ? 'active !border-blue-500 !bg-blue-600 !text-white shadow-lg shadow-blue-200' : ''}`}
    onClick={() => switchAdminTab('tags', () => setTagMessage(''))}
  >
    🎭 Manage Tags
  </button>

  <button
    className={`tab-btn rounded-full border border-blue-200 bg-white text-slate-700 ${activeTab === 'stores' ? 'active !border-blue-500 !bg-blue-600 !text-white shadow-lg shadow-blue-200' : ''}`}
    onClick={() => switchAdminTab('stores', () => { if (setStoreMessage) setStoreMessage(''); if (fetchStores) fetchStores(); })}
  >
    🏬 Manage Stores
  </button>

<button 
  className={`tab-btn rounded-full border border-blue-200 bg-white text-slate-700 ${activeTab === 'about' ? 'active !border-blue-500 !bg-blue-600 !text-white shadow-lg shadow-blue-200' : ''}`}
  onClick={() => switchAdminTab('about')}
>
  📝 Edit About Page
</button>

<button 
  className={`tab-btn rounded-full border border-blue-200 bg-white text-slate-700 ${activeTab === 'careers' ? 'active !border-blue-500 !bg-blue-600 !text-white shadow-lg shadow-blue-200' : ''}`}
  onClick={() => switchAdminTab('careers')}
>
  👔 Edit Careers Page
</button>


<button
  className={`tab-btn rounded-full border border-blue-200 bg-white text-slate-700 ${activeTab === 'categories' ? 'active !border-blue-500 !bg-blue-600 !text-white shadow-lg shadow-blue-200' : ''}`}
  onClick={() => switchAdminTab('categories')}
>
  🗂️ Categories
</button>

<button
  className={`tab-btn rounded-full border border-blue-200 bg-white text-slate-700 ${activeTab === 'bulkUploadHistory' ? 'active !border-blue-500 !bg-blue-600 !text-white shadow-lg shadow-blue-200' : ''}`}
  onClick={() => switchAdminTab('bulkUploadHistory', () => fetchUploadHistory(1))}
>
  📊 Upload History
</button>

</div>

  <div ref={tabContentRef} />


                   {/* Add New Product Tab */}
                   {activeTab === 'add' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(39,60,46,0.12)] sm:p-8">
              <h2 className="text-2xl font-black text-slate-900">Add New Product</h2>
              <form onSubmit={handleAddProduct} className="mt-6 flex flex-col gap-5">

                {/* Product Name */}
                <div className="form-row grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <label htmlFor="product_name" className="text-sm font-semibold text-slate-700">Product Name *</label>
                  <input
                    type="text"
                    id="product_name"
                    name="product_name"
                    value={newProduct.product_name}
                    onChange={handleNewProductChange}
                    placeholder="e.g., Building Blocks Set"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="product_code" className="text-sm font-semibold text-slate-700">Product Code</label>
                    <input
                      type="text"
                      id="product_code"
                      name="product_code"
                      value={newProduct.product_code}
                      onChange={handleNewProductChange}
                      placeholder="Enter your product code"
                      // required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                    
                {/* Category & Subcategory */}
                
                  <div className="flex flex-col gap-2">
                    <label htmlFor="category_id" className="text-sm font-semibold text-slate-700">Category *</label>
                    <select
                      id="category_id"
                      name="category_id"
                      value={newProduct.category_id || ''}
                      onChange={handleCategoryChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.sno} value={cat.sno}>{cat.category_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="subcategory_id" className="text-sm font-semibold text-slate-700">Subcategory *</label>
                    <select
                      id="subcategory_id"
                      name="subcategory_id"
                      value={newProduct.subcategory_id || ''}
                      onChange={handleSubcategoryChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">Select Subcategory</option>
                      {subcategories.map(sub => (
                        <option key={sub.sno} value={sub.sno}>{sub.subcategory_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="sub_subcategory_id" className="text-sm font-semibold text-slate-700">Sub-Subcategory</label>
                    <select
                      id="sub_subcategory_id"
                      name="sub_subcategory_id"
                      value={newProduct.sub_subcategory_id || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, sub_subcategory_id: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">Select Sub-Subcategory</option>
                      {subSubcategories.map(subsub => (
                        <option key={subsub.id} value={subsub.id}>{subsub.sub_subcategory_name}</option>
                      ))}
                    </select>
                  </div>

                {/* Descriptions and Details */}
                {/* <div className="form-row"> */}
                  <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-1">
                    <label htmlFor="product_description" className="text-sm font-semibold text-slate-700">Description</label>
                    <textarea
                      id="product_description"
                      name="product_description"
                      value={newProduct.product_description}
                      onChange={handleNewProductChange}
                      placeholder="Enter product description..."
                      rows="3"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-1">
                    <label htmlFor="product_highlights" className="text-sm font-semibold text-slate-700">Product Highlights</label>
                    <textarea
                      id="product_highlights"
                      name="product_highlights"
                      value={newProduct.product_highlights}
                      onChange={handleNewProductChange}
                      placeholder="Enter product highlights..."
                      rows="3"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                 

                  <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-1">
                    <label htmlFor="specifications" className="text-sm font-semibold text-slate-700">Product Specifications</label>
                    <textarea
                      id="specifications"
                      name="specifications"
                      value={newProduct.specifications}
                      onChange={handleNewProductChange}
                      placeholder="Enter product specifications..."
                      rows="3"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>


                  <div className="flex flex-col gap-2">
                    <label htmlFor="brand_name" className="text-sm font-semibold text-slate-700">Brand Name</label>
                    <select
                      id="brand_name"
                      name="brand_name"
                      value={newProduct.brand_name}
                      onChange={handleNewProductChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">Select Brand</option>
                      <option value="Picasso">Picasso</option>
                      <option value="Linograph">Linograph</option>
                      <option value="Mattel">Mattel</option>
                      <option value="Sakura">Sakura</option>
                      <option value="Market">Market</option>
                      <option value="Maped">Maped</option>
                      <option value="3M">3M</option>
                      <option value="Apsara">Apsara</option>
                      <option value="DELI">DELI</option>
                      <option value="Camel">Camel</option>
                      <option value="CASIO">CASIO</option>
                      <option value="ABRO">ABRO</option>
                    </select>
                  </div>
                {/* </div> */}

                {/* Price, Stock, Age Range, Gender */}
              {/* <div className="form-row"> */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="mrp" className="text-sm font-semibold text-slate-700">MRP (₹) *</label>
                    <input
                      type="number"
                      id="mrp"
                      name="mrp"
                      value={newProduct.mrp}
                      onChange={handleNewProductChange}
                      placeholder="Enter MRP"
                      min="0"
                      // required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="discount" className="text-sm font-semibold text-slate-700">Discount (%) *</label>
                    <input
                      type="number"
                      id="discount"
                      name="discount"
                      value={newProduct.discount}
                      onChange={handleNewProductChange}
                      placeholder="Enter Discount Percentage"
                      min="0"
                      max="100"
                      // required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                
                  <div className="flex flex-col gap-2">
                    <label htmlFor="product_price" className="text-sm font-semibold text-slate-700">Price (₹) *</label>
                    <input
                      type="number"
                      id="product_price"
                      name="product_price"
                      value={newProduct.product_price}
                      onChange={handleNewProductChange}
                      placeholder="Enter product price"
                      step="0.00"
                      min="0"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="stock_quantity" className="text-sm font-semibold text-slate-700">Stock Quantity *</label>
                    <input
                      type="number"
                      id="stock_quantity"
                      name="stock_quantity"
                      value={newProduct.stock_quantity}
                      onChange={handleNewProductChange}
                      placeholder="Enter stock quantity"
                      min="0"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

          

                  <div className="flex flex-col gap-2">
                    <label htmlFor="age_range" className="text-sm font-semibold text-slate-700">Age Range</label>
                    <select
                      id="age_range"
                      name="age_range"
                      value={newProduct.age_range}
                      onChange={handleNewProductChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">Select Age Range</option>
                      <option value="0-18 Months">0-18 Months</option>
                      <option value="18-36 Months">18-36 Months</option>
                      <option value="3-5 Years">3-5 Years</option>
                      <option value="5-7 Years">5-7 Years</option>
                      <option value="7-9 Years">7-9 Years</option>
                      <option value="9-12 Years">9-12 Years</option>
                      <option value="12+ Years">12+ Years</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="gender" className="text-sm font-semibold text-slate-700">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      value={newProduct.gender || ''}
                      onChange={handleNewProductChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">Select Gender</option>
                      <option value="Boys">Boys</option>
                      <option value="Girls">Girls</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>
                </div>
               
                
                {/* Product Image */}
                <div className="w-full" >
                  <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <label htmlFor="product_image" className="text-sm font-semibold text-slate-700" >Product Images (Optional, up to 5 files, max 2MB each)</label>
                  <input
                    type="file"
                    id="product_image"
                    accept="image/*"
                    multiple
                    onChange={handleNewProductImageChange}
                    className="text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
                  />
                  {newProductImages.length > 0 && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                      <p>Selected {newProductImages.length} image{newProductImages.length > 1 ? 's' : ''}:</p>
                      <ul className="mt-2 list-disc pl-5">
                        {newProductImages.map((file, index) => (
                          <li key={`${file.name}-${index}`}>
                            {file.name} ({(file.size / 1024).toFixed(0)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                </div>
                

                {/* Submit Button */}
                <button type="submit" className="inline-flex items-center justify-center rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={loading}>
                  {loading ? '⏳ Adding Product...' : '➕ Add Product'}
                </button>
              </form>


              
             
              {/* Bulk Upload via Excel */}
                  <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">Bulk Upload via Excel</h3>
                <p className="text-sm text-slate-600">
                  Upload multiple products at once using an Excel file (.xlsx or .xls)
                </p>

                <form onSubmit={handleBulkProductUpload} className="mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label htmlFor="bulk-file" className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                    {bulkFile ? bulkFile.name : "Choose file (.xlsx, .xls, .csv, .txt)"}
                  </label>
                  <input
                    id="bulk-file"
                    type="file"
                    accept=".xls,.xlsx,.csv,.txt,.tsv"
                    onChange={(e) => setBulkFile(e.target.files[0])}
                    className="text-sm text-slate-600"
                  />

                  <button type="submit" className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={bulkLoading}>
                    {bulkLoading ? "Uploading..." : "Upload File"}
                  </button>
                </form>

                {bulkMessage && <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{bulkMessage}</p>}

                {bulkMessage && bulkMessage.includes('✅ Processed') && (
                  <div className="mt-4 flex flex-wrap gap-3 rounded-md bg-emerald-50 p-3">
                    <button
                      onClick={() => downloadReportFile('accepted', 'Accepted_Products')}
                      className="rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    >
                      📥 Download Accepted Products
                    </button>
                    <button
                      onClick={() => downloadReportFile('rejected', 'Rejected_Products')}
                      className="rounded-md bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
                    >
                      📥 Download Rejected with Reasons
                    </button>
                  </div>
                )}
                
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
                  <h4 className="mb-2 text-base font-bold text-slate-900">Excel format example</h4>
                  <ul className="list-disc space-y-1 pl-5">
                    <li><strong>Required:</strong> name, description, price, brand_name, category, subcategory_id, stock_quantity</li>
                    <li><strong>Optional:</strong> age_range, gender, highlights, specifications</li>
                    <li>Images can be added later manually.</li>
                  </ul>
                </div>



<button
  type="button"
  onClick={downloadProductTemplate}
  className="mb-3 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
>
  📥 Download Excel Template
</button>

              </div>
            </div>
          )}

          {/* 📊 Bulk Upload History Tab */}
          {activeTab === 'bulkUploadHistory' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(39,60,46,0.12)] sm:p-8">
              <h2 className="mb-5 text-2xl font-black text-slate-900">📊 Bulk Upload History</h2>
              
              {uploadHistoryLoading ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Loading upload history...</p>
              ) : uploadHistory.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No upload history found yet</p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-[760px] w-full border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          <th className="px-3 py-3">Upload Date</th>
                          <th className="px-3 py-3 text-center">Total Rows</th>
                          <th className="px-3 py-3 text-center">Accepted</th>
                          <th className="px-3 py-3 text-center">Rejected</th>
                          <th className="px-3 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadHistory.map((upload) => (
                          <tr key={upload.upload_id} className="border-t border-slate-100 text-sm text-slate-700">
                            <td className="px-3 py-3">{new Date(upload.uploaded_at).toLocaleString()}</td>
                            <td className="px-3 py-3 text-center font-medium">{upload.total_rows}</td>
                            <td className="px-3 py-3 text-center font-semibold text-emerald-700">{upload.accepted_rows}</td>
                            <td className="px-3 py-3 text-center font-semibold text-rose-700">{upload.rejected_rows}</td>
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap justify-center gap-2">
                              {upload.accepted_rows > 0 && (
                                <button
                                  onClick={() => downloadReportFile('accepted', `accepted_products_${upload.upload_id}`)}
                                  className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                                  title="Download accepted/inserted products"
                                >
                                  Accepted
                                </button>
                              )}
                              {upload.rejected_rows > 0 && (
                                <button
                                  onClick={() => downloadReportFile('rejected', `rejected_products_${upload.upload_id}`)}
                                  className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
                                  title="Download rejected products with reasons"
                                >
                                  Rejected
                                </button>
                              )}
                              {/* Delete record */}
                              <button
                                onClick={() => deleteUploadRecord(upload.upload_id)}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                title="Delete upload history record"
                              >
                                Delete
                              </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Download Info */}
                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                    <strong>💡 Tip:</strong> Click the green <strong>✅ Accepted</strong> button to download successfully added products. Click the red <strong>❌ Rejected</strong> button to see why products were rejected with detailed reasons for each item.
                  </div>

                  {/* Pagination */}
                  {uploadHistoryTotal > 10 && (
                    <div className="pagination mt-5 flex items-center justify-center gap-3">
                      <button 
                        onClick={() => fetchUploadHistory(uploadHistoryPage - 1)}
                        disabled={uploadHistoryPage === 1}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ← Previous
                      </button>
                      <span className="text-sm font-semibold text-slate-600">Page {uploadHistoryPage}</span>
                      <button 
                        onClick={() => fetchUploadHistory(uploadHistoryPage + 1)}
                        disabled={uploadHistoryPage * 10 >= uploadHistoryTotal}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}




          {/* Orders Tab */}
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(39,60,46,0.12)] sm:p-8">
              <h2 className="mb-5 text-2xl font-black text-slate-900">Customer Orders {adminOrders.length > 0 ? `(${adminOrders.length})` : ''}</h2>

              {/* Filters */}
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <label className="text-sm font-semibold text-slate-700">Filter by status:</label>
                <select
                  value={ordersStatusFilter}
                  onChange={(e) => setOrdersStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="accepted">Accepted</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {ordersStatusFilter !== 'all' && (
                  <div className="flex flex-wrap items-center gap-2 w-full">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold capitalize text-indigo-700">
                      {ordersStatusFilter}
                    </span>
                    <button
                      onClick={() => setOrdersStatusFilter('all')}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {loadingOrders && <div className="py-10 text-center text-sm text-slate-500">Loading orders...</div>}
              {ordersError && !loadingOrders && <p className="p-5 text-sm font-semibold text-red-600">{ordersError}</p>}

              {!loadingOrders && !ordersError && adminOrders.length === 0 && (
                <div className="py-10 text-center text-sm text-slate-500">
                  <p>No orders found.</p>
                </div>
              )}

              {!loadingOrders && !ordersError && adminOrders.length > 0 && (
                <div className="flex flex-col gap-6">
                  {adminOrders.map(order => {
                    const orderDate = order.created_at 
                      ? new Date(order.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Unknown date';

                    const statusBadgeClasses = {
                      pending: 'bg-amber-500',
                      accepted: 'bg-emerald-500',
                      processing: 'bg-blue-500',
                      shipped: 'bg-violet-500',
                      delivered: 'bg-emerald-600',
                      cancelled: 'bg-red-500'
                    };

                    return (
                      <div 
                        key={order.id} 
                        className="rounded-xl border border-amber-200 bg-amber-50/80 p-6 shadow-[0_4px_12px_rgba(39,60,46,0.08)]"
                      >

                        {/* Order header */}
                        <div className="mb-5 flex flex-col gap-3 border-b-2 border-amber-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="mb-2 text-2xl font-bold text-emerald-950">
                              Order #{order.order_number}
                            </h3>
                            <p className="m-0 text-sm text-slate-600">
                              📅 Placed on: {orderDate}
                            </p>
                          </div>
                          <div className={`rounded-full px-4 py-2 text-sm font-semibold capitalize text-white ${statusBadgeClasses[order.order_status] || 'bg-slate-500'}`}>
                            {order.order_status || 'pending'}
                          </div>
                        </div>

                        {/* Customer info */}
                        <div className="mb-5">
                          <h4 className="mb-3 text-lg font-semibold text-emerald-950">
                            👤 Customer Information
                          </h4>
                          <div className="grid gap-3 rounded-lg bg-white p-4 md:grid-cols-3">
                            <div><strong>Name:</strong> {order.shipping_full_name || 'N/A'}</div>
                            <div><strong>Email:</strong> {order.shipping_email || 'N/A'}</div>
                            <div><strong>Phone:</strong> {order.shipping_phone || 'N/A'}</div>
                          </div>
                        </div>

                        {/* Shipping */}
                        <div className="mb-5">
                          <h4 className="mb-3 text-lg font-semibold text-emerald-950">
                            📍 Shipping Address
                          </h4>
                          <div className="space-y-1 rounded-lg bg-white p-4 leading-7">
                            {order.shipping_full_name && <div>{order.shipping_full_name}</div>}
                            <div>{order.shipping_address || 'N/A'}</div>
                            <div>
                              {order.shipping_city || ''}{order.shipping_state ? `, ${order.shipping_state}` : ''} {order.shipping_zip_code || ''}
                            </div>
                            <div>{order.shipping_country || 'India'}</div>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="mb-5">
                          <h4 className="mb-3 text-lg font-semibold text-emerald-950">
                            🛍️ Products Ordered
                          </h4>
                          <div className="rounded-lg bg-white p-4">
                            {Array.isArray(order.items) && order.items.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-[620px] w-full border-collapse">
                                  <thead>
                                    <tr className="border-b-2 border-amber-100">
                                      <th className="p-2.5 text-left">Product Name</th>
                                      <th className="p-2.5 text-center">Quantity</th>
                                      <th className="p-2.5 text-right">Price</th>
                                      <th className="p-2.5 text-right">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.items.map((item, idx) => (
                                      <tr key={idx} className="border-b border-slate-100">
                                        <td className="px-2.5 py-3">{item.product_name}</td>
                                        <td className="px-2.5 py-3 text-center">{item.quantity}</td>
                                        <td className="px-2.5 py-3 text-right">₹{item.product_price}</td>
                                        <td className="px-2.5 py-3 text-right font-semibold">
                                          ₹{item.item_total}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p>No items found</p>
                            )}
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="mb-5">
                          <h4 className="mb-3 text-base font-semibold text-emerald-950">💰 Order Summary</h4>
                          <div className="rounded-lg bg-white p-4">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>₹{order.subtotal}</span>
                            </div>
                            <div className="flex justify-between">
                              {/* <span>GST (18%):</span>
                              <span>₹{order.gst_amount}</span> */}
                            </div>
                            <div className="mt-2.5 flex justify-between border-t-2 border-amber-100 pt-2.5 text-lg font-bold">
                              <span>Total Amount:</span>
                              <span>₹{order.total_amount}</span>
                            </div>
                          </div>
                        </div>

                        

                        {order.order_status === 'pending' && (
                          <div className="flex flex-wrap justify-end gap-3">
    
    {/* Cancel Button */}
    <button
      onClick={() => handleCancelOrder(order.id)}
      className="min-h-[44px] rounded-lg bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600"
    >
      Cancel Order
    </button>

    {/* Accept Button */}
    <button
      onClick={() => handleAcceptOrder(order.id)}
      className="min-h-[44px] rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-600"
    >
      Accept Order
    </button>

  </div>
)}

                        {order.order_status === 'accepted' && (
  <div className="flex flex-wrap justify-end gap-3">
    
    {/* Cancel Button */}
    <button
      onClick={() => handleCancelOrder(order.id)}
      className="min-h-[44px] rounded-lg bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600"
    >
      Cancel Order
    </button>

  </div>
)}
</div>
    );
  })}
  </div>
              )}
            </div>
          )}

{/* 🌟 ANNOUNCEMENT TAB (NEW) */}
{activeTab === 'announcement' && (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(39,60,46,0.12)] sm:p-8">
    <h2 className="mb-4 text-2xl font-black text-slate-900">📢 Top Announcements</h2>

    <div className="mb-3">
      <form onSubmit={handleAddAnnouncement} className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Enter announcement text (max 2000 chars)"
          value={newAnnouncementText}
          onChange={(e) => setNewAnnouncementText(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
        <button type="submit" className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 sm:w-auto">Add</button>
      </form>
    </div>

    <div className="mt-3">
      <h3 className="mb-3 text-base font-semibold text-slate-800">Existing Announcements ({announcements.length})</h3>

      {announcementsLoading ? (
        <p className="text-sm text-slate-500">Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <p className="text-sm text-slate-500">No announcements. Add one above.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {announcements.map((a) => (
            <div key={a.id} className="flex flex-col gap-2 rounded-lg border border-slate-100 p-2 sm:flex-row sm:items-center">
              {editingAnnouncementId === a.id ? (
                <>
                  <input
                    value={editingAnnouncementText}
                    onChange={(e) => setEditingAnnouncementText(e.target.value)}
                    className="flex-1 rounded-md border border-slate-200 px-2.5 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  <button onClick={() => saveEditAnnouncement(a.id)} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600">Save</button>
                  <button onClick={() => { setEditingAnnouncementId(null); setEditingAnnouncementText(''); }} className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">Cancel</button>
                </>
              ) : (
                <>
                  <div className="flex-1 text-sm text-slate-700">{a.text}</div>
                  <div className="flex gap-2 sm:ml-auto">
                    <button onClick={() => startEditAnnouncement(a)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">Edit</button>
                    <button onClick={() => deleteAnnouncement(a.id)} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700">Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

  </div>
)}

{activeTab === 'about' && (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(39,60,46,0.12)] sm:p-8">
    <h2 className="mb-4 text-2xl font-black text-slate-900">📝 Edit About Page</h2>

    <div>
      <label>About Page Content</label>
      <textarea
        value={aboutContent}
        onChange={(e) => setAboutContent(e.target.value)}
        rows={10}
        placeholder="Write About page content here..."
        className="w-full rounded-lg border border-slate-300 px-3 py-3 text-[15px] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>

    <button
      className="mt-4 rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={savingAbout}
      onClick={async () => {
        try {
          setSavingAbout(true);
          await axios.put(
            `${API_BASE_URL}/api/about`,
            { content: aboutContent },
            { headers: getAdminHeaders() }
          );
          showToast("✅ About page updated successfully!", "success");
        } catch {
          showToast("❌ Failed to update About page", "error");
        } finally {
          setSavingAbout(false);
        }
      }}
    >
      {savingAbout ? "Saving..." : "Save About Page"}
    </button>
  </div>
)}

{activeTab === "categories" && (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(39,60,46,0.12)] sm:p-8">
    <h2 className="mb-5 text-2xl font-black text-slate-900">Categories & Subcategories</h2>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-lg font-bold text-slate-900">Add Category</h3>
        <form onSubmit={handleAddCategory} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="Category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <button className="min-h-[42px] rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">Add</button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-lg font-bold text-slate-900">Add Subcategory</h3>
        <form onSubmit={handleAddSubcategory} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,1fr,auto]">
          <select
            value={selectedParentCategoryId}
            onChange={(e) => setSelectedParentCategoryId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Parent Category</option>
            {categories.map(c => (
              <option key={c.sno} value={c.sno}>
                {c.category_name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Subcategory name"
            value={newSubcategoryName}
            onChange={(e) => setNewSubcategoryName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <button className="min-h-[42px] rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">Add</button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-lg font-bold text-slate-900">Add Sub-subcategory</h3>
        <form onSubmit={handleAddSubSubcategory} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,1fr,1fr,auto]">
          <select
            value={selectedParentCategoryId}
            onChange={(e) => { setSelectedParentCategoryId(e.target.value); setSelectedParentSubcategoryForSubSub(''); }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Parent Category</option>
            {categories.map(c => (
              <option key={c.sno} value={c.sno}>
                {c.category_name}
              </option>
            ))}
          </select>

          <select
            value={selectedParentSubcategoryForSubSub}
            onChange={(e) => setSelectedParentSubcategoryForSubSub(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Parent Subcategory</option>
            {allSubcategories.filter(s => String(s.category_id) === String(selectedParentCategoryId)).map(s => (
              <option key={s.sno} value={s.sno}>{s.subcategory_name}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Sub-subcategory name"
            value={newSubSubcategoryName}
            onChange={(e) => setNewSubSubcategoryName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <button className="min-h-[42px] rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">Add</button>
        </form>
      </section>
    </div>

    <div className="mb-3 mt-5">
      <input
        placeholder="Search categories or subcategories"
        value={categoriesSearch}
        onChange={(e) => setCategoriesSearch(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-base font-bold text-slate-900">Categories</h3>
        {(() => {
          const q = categoriesSearch.trim().toLowerCase();
          const matchedCats = q ? categories.filter(c => c.category_name.toLowerCase().includes(q)) : categories;
          if (matchedCats.length === 0) return <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No categories found</div>;
          return (
            <div className="space-y-2">
              {matchedCats.map(cat => (
                <div key={cat.sno} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {editing?.type === "category" && editing.id === cat.sno ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,auto,auto]">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                      <button className="min-h-[40px] rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700" onClick={saveEdit}>Save</button>
                      <button className="min-h-[40px] rounded-lg bg-slate-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-600" onClick={cancelEdit}>Cancel</button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm text-slate-800">{cat.category_name}</strong>
                      <div className="flex gap-2">
                        <button className="min-h-[38px] rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700" onClick={() => startEdit("category", { id: cat.sno, name: cat.category_name })}>Edit</button>
                        <button className="min-h-[38px] rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700" onClick={() => deleteItem("category", cat.sno)}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-base font-bold text-slate-900">Subcategories</h3>
        {(() => {
          const q = categoriesSearch.trim().toLowerCase();
          const matchedSubs = q ? allSubcategories.filter(s => s.subcategory_name.toLowerCase().includes(q)) : allSubcategories;
          if (matchedSubs.length === 0) return <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No subcategories found</div>;
          return (
            <div className="space-y-2">
              {matchedSubs.map(sub => (
                <div key={sub.sno} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {editing?.type === "subcategory" && editing.id === sub.sno ? (
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr,1fr,auto,auto]">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                      <select
                        value={editParentCategoryId}
                        onChange={(e) => setEditParentCategoryId(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        {categories.map(c => (
                          <option key={c.sno} value={c.sno}>
                            {c.category_name}
                          </option>
                        ))}
                      </select>
                      <button className="min-h-[40px] rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700" onClick={saveEdit}>Save</button>
                      <button className="min-h-[40px] rounded-lg bg-slate-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-600" onClick={cancelEdit}>Cancel</button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-slate-800">{sub.subcategory_name}</span>
                      <div className="flex gap-2">
                        <button className="min-h-[38px] rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700" onClick={() => startEdit("subcategory", { id: sub.sno, name: sub.subcategory_name, category_id: sub.category_id })}>Edit</button>
                        <button className="min-h-[38px] rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700" onClick={() => deleteItem("subcategory", sub.sno)}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-base font-bold text-slate-900">Sub-subcategories</h3>
        {(() => {
          const q = categoriesSearch.trim().toLowerCase();
          const matched = q ? allSubSubcategories.filter(s => s.sub_subcategory_name.toLowerCase().includes(q)) : allSubSubcategories;
          if (matched.length === 0) return <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No sub-subcategories found</div>;
          return (
            <div className="space-y-2">
              {matched.map(sub => (
                <div key={sub.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {editing?.type === "subsub" && editing.id === sub.id ? (
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr,1fr,1fr,auto]">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                      <select
                        value={editParentCategoryId}
                        onChange={(e) => setEditParentCategoryId(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        {categories.map(c => (
                          <option key={c.sno} value={c.sno}>{c.category_name}</option>
                        ))}
                      </select>
                      <select
                        value={editParentSubcategoryId}
                        onChange={(e) => setEditParentSubcategoryId(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        {allSubcategories.filter(s => String(s.category_id) === String(editParentCategoryId)).map(s => (
                          <option key={s.sno} value={s.sno}>{s.subcategory_name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button className="min-h-[40px] rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700" onClick={saveEdit}>Save</button>
                        <button className="min-h-[40px] rounded-lg bg-slate-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-600" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-slate-800">{sub.sub_subcategory_name}</span>
                      <div className="flex gap-2">
                        <button className="min-h-[38px] rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700" onClick={() => startEdit("subsub", { id: sub.id, name: sub.sub_subcategory_name, category_id: sub.category_id, subcategory_id: sub.subcategory_id })}>Edit</button>
                        <button className="min-h-[38px] rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700" onClick={() => deleteItem("subsub", sub.id)}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </section>
    </div>

  </div>
)}



{activeTab === 'careers' && (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(39,60,46,0.12)] sm:p-8">
    <h2 className="mb-5 text-2xl font-black text-slate-900">👔 Edit Careers Page</h2>

    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700">Careers Page Content</label>
      <textarea
        value={careersContent}
        onChange={(e) => setCareersContent(e.target.value)}
        rows={10}
        placeholder="Write Careers page content here..."
        className="min-h-64 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>

    <button
      className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={savingCareers}
      onClick={async () => {
        try {
          setSavingCareers(true);
          await axios.put(
            `${API_BASE_URL}/api/careers`,
            { content: careersContent },
            { headers: getAdminHeaders() }
          );
          showToast("✅ Careers page updated successfully!", "success");
        } catch {
          showToast("❌ Failed to update Careers page", "error");
        } finally {
          setSavingCareers(false);
        }
      }}
    >
      {savingCareers ? "Saving..." : "Save Careers Page"}
    </button>
  </div>
)}



          {/* Upload Images Tab */}
          {activeTab === 'upload' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(39,60,46,0.12)] sm:p-8">
              <h2 className="mb-5 text-2xl font-black text-slate-900">Upload Product Images</h2>
              <form onSubmit={handleUpload} className="mt-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  
                 <Select
                    options={uploadOptions}
                    isLoading={loadingProducts}
                    placeholder="Search & select product..."
                    value={uploadOptions.find(
                      (opt) => opt.value === Number(selectedProductId)
                    )}
                    onChange={(opt) => setSelectedProductId(opt ? opt.value : "")}
                    isClearable

                    /* 🔽 FIX: open menu upwards */
                    menuPlacement="top"

                    /* 🔽 FIX: render menu in body so footer can't overlap */
                    menuPortalTarget={document.body}

                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />

                </div>


             <div className="flex flex-col gap-3" >
           <label htmlFor="file-input" className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 px-4 py-3 font-semibold text-[#273c2e] transition hover:border-amber-400 hover:bg-[#fff7eb]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                <polyline points="7 9 12 4 17 9" />
                <line x1="12" y1="4" x2="12" y2="16" />
              </svg>
              Upload Images
            </label>


              <input
                type="file"
                id="file-input"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                required
                className="hidden"
              />

              {selectedFiles.length > 0 && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="m-0 text-sm font-medium text-slate-700">✓ Selected {selectedFiles.length} image{selectedFiles.length > 1 ? 's' : ''}:</p>
                        <button
                          type="button"
                          onClick={handleDeleteAllImages}
                          className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
                        >
                          Delete All
                        </button>
                      </div>
                      <ul className="m-0 mt-3 list-none p-0">
                        {selectedFiles.map((file, index) => (
                          <li key={`${file.name}-${index}`} className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-100 bg-amber-50 px-3 py-2">
                            <span className="text-sm text-slate-700">{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSingleImage(index)}
                              className="rounded-md bg-amber-400 px-2 py-1 text-xs font-semibold text-slate-900 transition hover:bg-amber-300"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
            </div>



                <div className="flex flex-col gap-3 sm:flex-row">
  {/* Single product upload */}
  <button type="submit" className="w-full rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto" disabled={loading}>
    {loading ? '⏳ Uploading...' : '📸 Upload to Selected Product'}
  </button>

  {/* Bulk upload button intentionally omitted. */}
</div>

              </form>
            </div>
          )}
{/* Manage Products Tab */}
{activeTab === "manage" && (
  <section className="mx-auto w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(39,60,46,0.12)] sm:p-6 lg:p-8">
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="m-0 text-2xl font-black text-slate-900">Manage Products</h2>
        <p className="mt-1 text-sm text-slate-600">{filteredManageProducts.length} items found</p>
      </div>
    </div>
    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr),220px,190px] lg:max-w-[820px]">

  <input
    type="text"
    placeholder="Search by product name or code"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
  />

  <select
    value={manageSort}
    onChange={(e) => setManageSort(e.target.value)}
    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
  >
    <option value="latest">Sort: Latest</option>
    <option value="name_asc">Sort: Name A-Z</option>
    <option value="name_desc">Sort: Name Z-A</option>
    <option value="price_low">Sort: Price Low to High</option>
    <option value="price_high">Sort: Price High to Low</option>
    <option value="stock_low">Sort: Stock Low to High</option>
  </select>

  <button
    type="button"
    onClick={handleDownloadExcel}
    className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
  >
    ⬇ Download Excel
  </button>

</div>

    {loadingProducts ? (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm font-medium text-slate-600">
        Loading products...
      </div>
    ) : filteredManageProducts.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
        <p className="m-0 text-base font-semibold text-slate-700">No products match your search.</p>
        <p className="mt-2 text-sm text-slate-500">Try a different name or product code.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {sortedManageProducts.map((product) => (
          <article key={product.id} className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-sky-200 bg-white shadow-[0_10px_26px_rgba(14,116,144,0.10)] ring-1 ring-sky-100 transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_16px_34px_rgba(14,116,144,0.16)]">
            <div className="relative flex h-[180px] items-center justify-center bg-white p-1 sm:h-[200px] lg:h-[210px]">
              {(() => {
                const rawImage =
                  product.image ||
                  product.image_url ||
                  product.images?.[0]?.url ||
                  product.images?.[0] ||
                  "";

                let imageSrc = "";
                if (typeof rawImage === "string" && rawImage.trim() !== "") {
                  imageSrc = rawImage.startsWith("http")
                    ? rawImage
                    : `${API_BASE_URL}${rawImage}`;
                }

                if (!imageSrc || imageSrc.includes("undefined")) {
                  return <div className="grid h-full w-full place-items-center rounded-xl border border-dashed border-slate-200 bg-white text-[11px] font-semibold text-slate-500">No image</div>;
                }

                return (
                  <>
                    <img
                      src={imageSrc}
                      alt={product.name || product.product_name || "Product"}
                      className="h-full w-full rounded-xl object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = "none";
                      }}
                    />

                    <button onClick={() => handleDeleteProductImage(product.id)} className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-rose-500 text-sm text-white shadow-sm transition hover:bg-rose-600" title="Delete Image">🗑️</button>
                  </>
                );
              })()}
            </div>

            <div className="flex flex-1 flex-col gap-2 p-3.5">
              <div>
                <h3 className="m-0 line-clamp-2 text-sm font-bold leading-5 text-slate-900">{product.name || product.product_name || "Unnamed product"}</h3>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">Code: {product.product_code || "N/A"}</p>
              </div>

              <p className="line-clamp-2 min-h-[30px] text-xs leading-5 text-slate-600">{product.description || "No description available."}</p>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                <span className="rounded-full bg-sky-50 px-2 py-1 text-center font-semibold text-sky-800">Price: Rs {product.price || 0}</span>
                <span className="rounded-full bg-sky-50 px-2 py-1 text-center font-semibold text-sky-800">Age: {product.age_range || "N/A"}</span>
              </div>

              {editingProductId === product.id ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Update stock quantity</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,auto,auto]">
                    <input
                      type="number"
                      min="0"
                      value={editStockValue}
                      onChange={(e) => setEditStockValue(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <button
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      onClick={() => handleUpdateStock(product.id)}
                    >
                      Save
                    </button>

                    <button
                      className="rounded-lg bg-slate-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                      onClick={cancelEditingStock}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

             <div className="grid grid-cols-[auto_60px_1fr] gap-2 items-center w-full">
  
  <span className="text-xs whitespace-nowrap">
    Stock: {product.stock_quantity}
  </span>

  <input
    type="number"
    value={quickAddQty[product.id] || 1}
    onChange={(e) =>
  setQuickAddQty((prev) => ({
    ...prev,
    [product.id]: e.target.value,
  }))
}
    className="w-full px-2 py-1 border rounded-md text-sm"
  />

  <button
    onClick={() => handleQuickAddToBill(product.id)}
    className="w-full px-2 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-pink-500 text-white"
  >
    Add to bag
  </button>

</div>

              <div className="mt-auto grid grid-cols-2 gap-2">
                <button
                  onClick={() => window.open(`/product/${product.id}`, "_blank")}
                  className="min-h-[40px] w-full rounded-lg border border-blue-500 bg-white px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  View details
                </button>

                {editingProductId !== product.id && (
                  <button
                    className="min-h-[40px] w-full rounded-lg border border-blue-500 bg-white px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                    onClick={() => startEditingStock(product.id, product.stock_quantity)}
                  >
                    Edit stock
                  </button>
                )}

                <button
                  className={`min-h-[40px] w-full rounded-lg border border-rose-400 bg-white px-3 py-2 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 ${editingProductId !== product.id ? "col-span-2" : "col-span-1"}`}
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  Delete product
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    )}
  </section>
)}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="mx-auto w-full max-w-[1200px] rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(39,60,46,0.12)] sm:p-8">
              <h2 className="mb-5 text-2xl font-black text-slate-900">Offline Billing (POS)</h2>

              <div className="billing-container grid gap-5 xl:grid-cols-2">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="mb-3 text-lg font-bold text-slate-900">Customer Information (Optional)</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label htmlFor="customer-name" className="mb-1.5 block text-sm font-semibold text-slate-700">Customer Name</label>
                        <input
                          type="text"
                          id="customer-name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Enter customer name"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label htmlFor="customer-phone" className="mb-1.5 block text-sm font-semibold text-slate-700">Phone Number</label>
                        <input
                          type="tel"
                          id="customer-phone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Enter phone number"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="mb-3 text-lg font-bold text-slate-900">Add Items to Bill</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr,1fr]">
                      <div>
                        <label htmlFor="billing-product-select" className="mb-1.5 block text-sm font-semibold text-slate-700">Select Product</label>
                        <select
                          id="billing-product-select"
                          value={selectedBillingProduct}
                          onChange={(e) => setSelectedBillingProduct(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="">-- Choose a Product --</option>
                          {products.filter(p => p.stock_quantity > 0).map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - ₹{product.price} (Stock: {product.stock_quantity})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="billing-quantity" className="mb-1.5 block text-sm font-semibold text-slate-700">Quantity</label>
                        <input
                          type="number"
                          id="billing-quantity"
                          value={billingQuantity}
                          onChange={(e) => setBillingQuantity(parseInt(e.target.value, 10) || 1)}
                          min="1"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                        <div className="mt-3">
                          <button
                            type="button"
                            className="w-full rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
                            onClick={handleAddToBill}
                          >
                            Add to Bill
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-lg font-bold text-slate-900">Current Bill</h3>

                  {billItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
                      <p className="text-sm text-slate-500">No items added yet</p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[320px] overflow-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr>
                              <th className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700">Product</th>
                              <th className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700">Price</th>
                              <th className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700">Qty</th>
                              <th className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700">Total</th>
                              <th className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {billItems.map((item) => (
                              <tr key={item.id}>
                                <td className="border-b border-slate-100 px-3 py-2 text-slate-800">{item.name}</td>
                                <td className="border-b border-slate-100 px-3 py-2 text-slate-800">₹{item.price.toFixed(2)}</td>
                                <td className="border-b border-slate-100 px-3 py-2">
                                  <div className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-1 py-1">
                                    <button
                                      onClick={() => handleUpdateBillQuantity(item.id, item.quantity - 1)}
                                      className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                                    >
                                      -
                                    </button>
                                    <span className="min-w-[24px] text-center text-sm font-semibold text-slate-700">{item.quantity}</span>
                                    <button
                                      onClick={() => handleUpdateBillQuantity(item.id, item.quantity + 1)}
                                      className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="border-b border-slate-100 px-3 py-2 font-semibold text-slate-800">₹{(item.price * item.quantity).toFixed(2)}</td>
                                <td className="border-b border-slate-100 px-3 py-2">
                                  <button
                                    onClick={() => handleRemoveFromBill(item.id)}
                                    className="rounded-md bg-rose-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between py-1.5 text-sm text-slate-700">
                          <span>Subtotal:</span>
                          <span>₹{calculateBillTotal().subtotal.toFixed(2)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                          <span>Total Amount:</span>
                          <span>₹{calculateBillTotal().total.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={handlePrintBill}
                          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          Print Bill
                        </button>
                        <button
                          onClick={handleClearBill}
                          className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
                        >
                          Clear Bill
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'giftcard' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(39,60,46,0.12)] sm:p-8">
            <div>
              <h2 className="mb-5 text-2xl font-black text-slate-900">🎁 Add Gift Card</h2>
    </div>
    
    <div>
      <form
        onSubmit={handleAddGiftCard}
        className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
        encType="multipart/form-data"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Gift Card Title *</label>
            <input
              type="text"
              name="title"
              value={newGiftCard.title}
              onChange={handleGiftCardChange}
              placeholder="e.g., The Toycra Gift Card"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Brand *</label>
            <input
              type="text"
              name="brand"
              value={newGiftCard.brand}
              onChange={handleGiftCardChange}
              placeholder="e.g., Toycra"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

         
      </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">SKU *</label>
            <input
              type="text"
              name="sku"
              value={newGiftCard.sku}
              onChange={handleGiftCardChange}
              placeholder="e.g., TG500"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Base Price *</label>
            <input
              type="number"
              name="base_price"
              value={newGiftCard.base_price}
              onChange={handleGiftCardChange}
              placeholder="500"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Available Values (comma separated)</label>
            <input
              type="text"
              name="price_options"
              value={newGiftCard.price_options}
              onChange={handleGiftCardChange}
              placeholder="500,1000,2000,5000"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description *</label>
            <textarea
              name="description"
              value={newGiftCard.description}
              onChange={handleGiftCardChange}
              placeholder="Write a short description..."
              rows="3"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Upload Images *</label>
          <input type="file" accept="image/*" onChange={handleGiftCardImageChange} multiple required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700" />
          {giftCardImages && giftCardImages.length > 0 && (
            <p className="mt-2 text-xs font-medium text-slate-600">{giftCardImages.length} file(s) selected</p>
          )}
        </div>

        <button type="submit" className="w-full rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto" disabled={loading}>
          {loading ? 'Uploading...' : '🎁 Add Gift Card'}
        </button>
      </form>
    </div>

    {/* Available gift cards list */}
    <div className="mt-6">
      <h3 className="mb-3 text-lg font-bold text-slate-900">Available Gift Cards</h3>
      {loadingGiftCards ? (
        <p className="text-sm text-slate-500">Loading gift cards...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {giftCards.length === 0 ? (
            <p className="text-sm text-slate-500">No gift cards available.</p>
          ) : (
            giftCards.map((gc) => (
              <div key={gc.id} className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="aspect-[4/3] bg-slate-100">
                  {gc.image_url ? (
                    <img src={`${API_BASE_URL}${gc.image_url}`} alt={gc.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm font-semibold text-slate-500">📦 No Image</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col space-y-2 p-4">
                  <h3 className="min-h-[48px] text-base font-bold text-slate-900">{gc.title}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">Brand: {gc.brand}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">SKU: {gc.sku}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    <span>
                      Price: ₹{(() => {
                        try {
                          const opts = gc.price_options ? JSON.parse(gc.price_options) : [];
                          if (Array.isArray(opts) && opts.length > 0) return Number(opts[0]);
                        } catch (_) {}
                        return Number(gc.base_price || 0);
                      })()}
                    </span>
                  </div>
                  <div className="mt-auto pt-1">
                    <button 
                      className="min-h-[40px] w-full rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
                      onClick={() => handleDeleteGiftCard(gc.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  </div>
  )}

{activeTab === "brands" && (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(39,60,46,0.12)] sm:p-8">
    <h2 className="mb-5 text-2xl font-black text-slate-900">📦 Bulk Upload Brands</h2>

    <form onSubmit={handleBulkBrandUpload} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

  <div>

    {/* CLICKABLE BUTTON TO OPEN FILE PICKER */}
    <label
      htmlFor="brand-files"
      className="mb-3 inline-block cursor-pointer rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
    >
      📁 Select Brand Logos
    </label>

    {/* REAL FILE INPUT (HIDDEN) */}
   <input
  id="brand-files"
  type="file"
  accept="image/*"
  multiple
  onChange={handleBrandFilesChange}
  className="hidden"
/>


    {brandFiles.length > 0 && (
      <p className="text-xs font-medium text-slate-600">
        ✅ {brandFiles.length} file(s) selected
      </p>
    )}
  </div>

  <button
    type="submit"
    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
    disabled={brandUploading}
  >
    {brandUploading ? "Uploading..." : "🚀 Upload Brands"}
  </button>

  {brandMessage && (
    <p className="mt-2 text-sm font-medium text-slate-700">{brandMessage}</p>
  )}

</form>


    {/* Existing brands heading */}

    <h3 className="mt-6 text-lg font-bold text-slate-900">Existing Brands</h3>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.isArray(brands) && brands.map((b) => (
        <div key={b.id} className="relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-slate-50">
            <button
              className="absolute left-2 top-2 z-10 rounded-full bg-rose-500 px-2 py-1 text-[11px] font-bold text-white transition hover:bg-rose-600"
              onClick={() => handleDeleteBrand(b.id)}
              title="Delete Brand"
            >
              Delete
            </button>

            <button
              onClick={() => handleEditBrand(b)}
              title="Edit Brand Name"
              className="absolute right-2 top-2 z-10 rounded-full bg-blue-500 px-2 py-1 text-[11px] font-bold text-white transition hover:bg-blue-600"
            >
              Edit
            </button>

            <img src={`${API_BASE_URL}${b.logo_url}`} alt={b.name} className="h-full w-full object-contain p-2" />
          </div>

          {editingBrandId === b.id ? (
            <div className="mt-auto flex flex-col gap-2">
              <input
                type="text"
                value={editingBrandName}
                onChange={(e) => setEditingBrandName(e.target.value)}
                placeholder="Enter brand name"
                className="rounded-lg border border-slate-300 px-2 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSaveBrandName(b.id)}
                  disabled={updatingBrand}
                  className="rounded-lg bg-emerald-500 px-2 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingBrand ? "Saving" : "Save"}
                </button>
                <button
                  onClick={handleCancelEditBrand}
                  disabled={updatingBrand}
                  className="rounded-lg bg-rose-500 px-2 py-2 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-auto line-clamp-2 text-center text-sm font-semibold text-slate-700">{b.name}</p>
          )}
        </div>
      ))}
    </div>

  </div>
)}

{activeTab === "stores" && (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(39,60,46,0.12)] sm:p-8">
    <h2 className="mb-5 text-2xl font-black text-slate-900">🏬 Manage Stores</h2>

    <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          onClick={() => { setShowStoreForm(!showStoreForm); if (!showStoreForm && typeof fetchStores === 'function') fetchStores(); }}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${showStoreForm ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {showStoreForm ? '❌ Cancel' : '➕ Add New Store'}
        </button>

        <button
          onClick={() => fetchStores()}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          🔄 Refresh
        </button>

        {storeMessage && <div className={`text-sm font-medium ${storeMessage.includes('✅') ? 'text-emerald-600' : 'text-rose-600'}`}>{storeMessage}</div>}
      </div>

      {showStoreForm && (
        <form onSubmit={handleStoreSubmit} className="mt-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Name *</label>
              <input name="name" value={storeForm.name} onChange={handleStoreChange} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">City</label>
              <input name="city" value={storeForm.city} onChange={handleStoreChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Address</label>
              <input name="address" value={storeForm.address} onChange={handleStoreChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">State</label>
              <input name="state" value={storeForm.state} onChange={handleStoreChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Postal Code</label>
              <input name="postal_code" value={storeForm.postal_code} onChange={handleStoreChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Phone</label>
              <input name="phone" value={storeForm.phone} onChange={handleStoreChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
              <input name="email" value={storeForm.email} onChange={handleStoreChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Latitude</label>
              <input name="latitude" value={storeForm.latitude} onChange={handleStoreChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Longitude</label>
              <input name="longitude" value={storeForm.longitude} onChange={handleStoreChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Store Image (upload or URL)</label>

              <div className="flex flex-wrap items-center gap-2.5">
                <button type="button" onClick={() => document.getElementById('store-image-file')?.click()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">📁 Upload Image</button>
                <input id="store-image-file" type="file" accept="image/*" onChange={handleStoreImageChange} className="hidden" />

                <input name="image_url" value={storeForm.image_url} onChange={handleStoreChange} placeholder="or enter image URL (optional)" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </div>

              {storeImagePreview && (
                <div className="mt-2.5">
                  <img src={storeImagePreview} alt="Preview" className="max-h-[120px] max-w-[160px] rounded-lg border-2 border-emerald-100 object-cover" />
                  <div className="mt-1.5">
                    <button type="button" onClick={() => { setStoreImageFile(null); setStoreImagePreview(null); }} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700">Remove</button>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Open Hours (optional)</label>
              <input name="open_hours" value={storeForm.open_hours} onChange={handleStoreChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2.5">
            <button type="submit" disabled={savingStore} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400">
              {savingStore ? 'Saving...' : (editingStoreId ? '✏️ Update Store' : '✅ Create Store')}
            </button>
            {editingStoreId && (
              <button type="button" onClick={() => { setEditingStoreId(null); setStoreForm({ name: '', address: '', city: '', state: '', postal_code: '', phone: '', email: '', latitude: '', longitude: '', image_url: '', open_hours: '' }); setShowStoreForm(false); }} className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700">
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}
    </div>

    <div className="mt-5">
      <h3 className="text-lg font-bold text-slate-900">Existing Stores ({stores.length})</h3>

      {loadingStores ? (
        <p>Loading stores...</p>
      ) : stores.length === 0 ? (
        <p className="text-sm text-slate-500">No stores yet. Add one above.</p>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {stores.map(store => (
            <div key={store.id} className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <div className="flex gap-3">
                <div className="flex h-[96px] w-[116px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                  {store.image_url ? <img src={`${API_BASE_URL}${store.image_url}`} alt={store.name} className="h-full w-full object-cover" onError={(e) => e.target.style.display='none'} /> : <div className="text-sm text-slate-500">No Image</div>}
                </div>

                <div className="flex-1">
                  <h4 className="m-0 text-sm font-bold text-slate-900">{store.name}</h4>
                  <p className="my-1.5 text-sm text-slate-600">{store.address}</p>
                  <p className="m-0 text-xs text-slate-400">{store.city} {store.state} {store.postal_code}</p>
                  <p className="mt-1.5 text-xs text-slate-600">{store.phone} {store.email}</p>
                </div>
              </div>

              <div className="mt-auto flex gap-2 pt-3">
                <button onClick={() => handleEditStore(store)} className="min-h-[42px] flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Edit</button>
                <button onClick={() => handleDeleteStore(store.id, store.name)} className="min-h-[42px] flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

{activeTab === "tags" && (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(39,60,46,0.12)] sm:p-8">
    <h2 className="mb-5 text-2xl font-black text-slate-900">🎭 Manage Characters & Themes (Tags)</h2>

    {/* Add New Tag Form */}
    <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <button
        onClick={() => setShowTagForm(!showTagForm)}
        className={`mb-4 rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${showTagForm ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {showTagForm ? "❌ Cancel" : "➕ Add New Tag"}
      </button>

      {showTagForm && (
        <form onSubmit={handleAddTag} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Tag Name *
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="e.g., Marvel, Disney, Barbie"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Tag Slug (Optional - auto-generated if blank)
            </label>
            <input
              type="text"
              value={tagSlugInput}
              onChange={(e) => setTagSlugInput(e.target.value)}
              placeholder="e.g., marvel, disney, barbie"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              required={false}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              🖼️ Tag Image (Optional - 5MB max)
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#e0f2fe";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#f0f9ff";
              }}
            >
              📁 {tagImageFile ? `📸 ${tagImageFile.name}` : "Click to Select Image"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleTagImageChange}
              className="hidden"
            />
            {tagImagePreview && (
              <div className="mt-3 text-center">
                <img 
                  src={tagImagePreview} 
                  alt="Preview" 
                  className="mx-auto max-h-[150px] max-w-[150px] rounded-lg border-2 border-emerald-500" 
                />
                <p className="mt-1 text-xs font-semibold text-emerald-600">
                  ✅ Image selected: {tagImageFile?.name}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={addingTag}
              className="min-w-[180px] flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {addingTag ? "Adding..." : (editingTagId ? "✏️ Update Tag" : "✅ Add Tag with Image")}
            </button>
            {editingTagId && (
              <button
                type="button"
                onClick={() => {
                  setEditingTagId(null);
                  setTagInput("");
                  setTagSlugInput("");
                  setTagImageFile(null);
                  setTagImagePreview(null);
                }}
                className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                ❌ Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      {tagMessage && (
        <p className={`mt-3 text-sm font-medium ${tagMessage.includes("✅") ? 'text-emerald-600' : 'text-rose-600'}`}>
          {tagMessage}
        </p>
      )}
    </div>

    {/* 🎭 Bulk Upload Section */}
    <div className="mb-8 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
      <h3 className="mt-0 text-lg font-bold text-slate-900">📊 Bulk Upload Tags (Excel)</h3>
      <p className="mb-4 text-sm text-slate-600">
        Upload an Excel file with columns: <strong>name, slug, image_url</strong><br/>
        Download template: <a href="#" onClick={(e) => {
          e.preventDefault();
          downloadExcelTemplate();
        }} className="font-semibold text-blue-600 underline">📥 Download Template</a>
      </p>
      <button
        type="button"
        onClick={() => bulkFileInputRef.current?.click()}
        className="mb-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
      >
        📁 Choose Excel File
      </button>
      <input
        ref={bulkFileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => setBulkBulkFile(e.target.files?.[0] || null)}
        className="hidden"
      />
      {bulkBulkFile && (
        <div className="mt-2">
          <p className="text-xs text-slate-600">
            ✅ File selected: {bulkBulkFile.name}
          </p>
          <button
            type="button"
            onClick={handleBulkUpload}
            disabled={bulkTagsLoading}
            className="mt-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {bulkTagsLoading ? "Uploading..." : "⬆️ Upload Tags"}
          </button>
        </div>
      )}
    </div>

    {/* Existing Tags List */}
    <div>
      <h3 className="mb-2 text-base font-semibold text-gray-800">Existing Tags ({tags.length})</h3>
      
      {loadingTags ? (
        <p className="text-sm text-gray-500">Loading tags...</p>
      ) : tags.length === 0 ? (
        <p className="text-sm text-gray-500">No tags yet. Create your first tag above!</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex h-full flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                {tag.image ? (
                  <img
                    src={`${API_BASE_URL}${tag.image}`}
                    alt={tag.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="text-sm font-medium text-slate-500">No Image</div>
                )}
              </div>

              <div>
                <h4 className="mb-1 text-sm font-semibold text-gray-800">{tag.name}</h4>
                <p className="m-0 text-xs text-gray-600">ID: {tag.id}</p>
                <p className="m-0 text-xs text-gray-400">slug: {tag.slug}</p>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleEditTag(tag)}
                  className="min-h-[40px] rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  title={`Edit ${tag.name} tag`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTag(tag.id, tag.name)}
                  className="min-h-[40px] rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                  title={`Delete ${tag.name} tag`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}
        
        {/* Legacy small popup */}
        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <p>{popupMessage}</p>
            </div>
          </div>
        )}

        {/* Centered polished toast (unified across admin actions) */}
        {toast.show && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <div className="relative w-[min(92vw,440px)] rounded-[18px] border border-amber-300/70 bg-amber-50 px-7 py-6 text-center font-bold text-emerald-950 shadow-[0_18px_40px_rgba(39,60,46,0.18)] [animation:kpScaleIn_240ms_ease-out]">
              <div
                className={`mx-auto mb-3 grid h-[54px] w-[54px] place-items-center rounded-full border-2 border-white/60 text-amber-50 ${
                  toast.kind === 'error'
                    ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-[0_8px_20px_rgba(239,68,68,0.35)]'
                    : toast.kind === 'warn'
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-[0_8px_20px_rgba(245,158,11,0.35)]'
                    : 'bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-[0_8px_20px_rgba(111,191,140,0.35)]'
                }`}
              >
                {toast.kind === 'error' ? '!' : '✓'}
              </div>
              <div className="mb-1 text-lg tracking-[0.2px]">
                {toast.message}
              </div>
            </div>
          </div>
        )}

        {/* Centered confirm modal for destructive actions */}
        {confirmState.open && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
            <div className="w-[min(92vw,480px)] rounded-[18px] border border-amber-300/70 bg-amber-50 px-7 py-6 text-center font-bold text-emerald-950 shadow-[0_18px_40px_rgba(39,60,46,0.18)] [animation:kpScaleIn_240ms_ease-out]">
              <div className="mx-auto mb-3 grid h-[54px] w-[54px] place-items-center rounded-full border-2 border-white/60 bg-gradient-to-br from-amber-500 to-amber-600 text-amber-50 shadow-[0_8px_20px_rgba(245,158,11,0.35)]">
                !
              </div>
              <div className="mb-3 text-lg tracking-[0.2px]">
                {confirmState.message}
              </div>
              <div className="flex justify-center gap-3">
                <button className="min-w-[100px] rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600" onClick={handleConfirmYes}>
                  Yes
                </button>
                <button className="min-w-[100px] rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600" onClick={handleConfirmNo}>
                  No
                </button>
              </div>
            </div>
          </div>
        )}


      </main>
      <Footer />
    </div>
  );
};

export default AdminPage

