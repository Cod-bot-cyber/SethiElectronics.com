import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, CreditCard, CheckCircle2, ChevronRight, Phone, MessageCircle,
  Upload, Sparkles, HelpCircle, AlertCircle, Copy, Check 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/utils';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type CheckoutStep = 'address' | 'payment' | 'verification' | 'success';

export default function Checkout() {
  const { cart, currentUser, websiteSettings, clearCart, showToast } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<CheckoutStep>('address');
  const [createdOrderId, setCreatedOrderId] = useState<string>('');
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string>('');
  const [successAmount, setSuccessAmount] = useState<number>(0);

  // 1. Address Form State
  const [addressForm, setAddressForm] = useState({
    fullName: currentUser?.name || '',
    mobileNumber: currentUser?.mobile || '',
    houseNumber: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [addressErrors, setAddressErrors] = useState<any>({});

  // 2. Verification Form State
  const [verificationForm, setVerificationForm] = useState({
    contactNumber: currentUser?.mobile || '',
    utr: '',
    screenshotUrl: ''
  });
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [verificationErrors, setVerificationErrors] = useState<any>({});
  const [isCopyingUpi, setIsCopyingUpi] = useState<boolean>(false);

  // Auto redirect if cart is empty and not on success step
  useEffect(() => {
    if (cart.length === 0 && step !== 'success') {
      navigate('/cart');
    }
  }, [cart, step]);

  const orderAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // UPI configurations
  const upiId = websiteSettings?.upiId || 'sethielectronics@upi';
  const upiName = websiteSettings?.upiName || 'Sethi Electronics';
  const upiNote = websiteSettings?.transactionNote || 'Order Payment';
  const upiDeepLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${orderAmount}&tn=${encodeURIComponent(upiNote)}&cu=INR`;
  // Generate QR Code dynamically via QR Server API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiDeepLink)}`;

  // Address validation
  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: any = {};
    if (!addressForm.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!addressForm.mobileNumber.trim()) errors.mobileNumber = 'Mobile Number is required';
    else if (!/^\d{10}$/.test(addressForm.mobileNumber.trim())) errors.mobileNumber = 'Enter a valid 10-digit mobile number';
    if (!addressForm.houseNumber.trim()) errors.houseNumber = 'House / Flat number is required';
    if (!addressForm.street.trim()) errors.street = 'Street / Locality is required';
    if (!addressForm.city.trim()) errors.city = 'City is required';
    if (!addressForm.state.trim()) errors.state = 'State is required';
    if (!addressForm.pincode.trim()) errors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(addressForm.pincode.trim())) errors.pincode = 'Enter a valid 6-digit PIN code';

    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }

    setAddressErrors({});
    setStep('payment');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(upiId);
    setIsCopyingUpi(true);
    setTimeout(() => setIsCopyingUpi(false), 2000);
  };

  // Image compression helper for screenshots
  const compressAndResizeImage = (file: File, maxW = 800, maxH = 800, quality = 0.6): Promise<Blob | File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      img.src = objectUrl;
    });
  };

  // Screenshot Upload to Firebase Storage with Base64 Fallback
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshotFile(file);
      
      setUploadingImage(true);
      try {
        // 1. Pre-compress the image to prevent huge uploads and giant fallback data URIs
        const compressedBlob = await compressAndResizeImage(file, 800, 800, 0.6);

        // 2. Try Firebase Storage upload first with a generous 15-second timeout
        const storageRef = ref(storage, `orders/screenshots/${Date.now()}_${file.name}`);
        const uploadPromise = uploadBytes(storageRef, compressedBlob);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase Storage upload timed out')), 15000)
        );

        const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        setVerificationForm(prev => ({ ...prev, screenshotUrl: downloadUrl }));
        showToast('Payment screenshot uploaded successfully!', 'success');
      } catch (err) {
        console.warn('Firebase Storage upload failed or timed out, falling back to local compressed Base64:', err);
        // Fallback to Base64 of the compressed image!
        try {
          const compressedBlob = await compressAndResizeImage(file, 800, 800, 0.6);
          const base64Url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') resolve(reader.result);
              else reject(new Error('Failed to convert file to Base64'));
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(compressedBlob);
          });
          setVerificationForm(prev => ({ ...prev, screenshotUrl: base64Url }));
          showToast('Payment screenshot uploaded successfully (offline mode)!', 'success');
        } catch (readErr) {
          console.error('Error reading screenshot file: ', readErr);
          showToast('Failed to upload screenshot. Please try again.', 'error');
        }
      } finally {
        setUploadingImage(false);
      }
    }
  };

  // Submit Order and Verify Payment
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: any = {};
    if (!verificationForm.contactNumber.trim()) errors.contactNumber = 'Contact Number is required';
    if (!verificationForm.utr.trim()) errors.utr = '12-Digit UTR is required';
    else if (!/^\d{12}$/.test(verificationForm.utr.trim())) errors.utr = 'UTR must be a valid 12-digit number';
    if (!verificationForm.screenshotUrl && !screenshotFile) errors.screenshot = 'Payment screenshot is required';

    if (Object.keys(errors).length > 0) {
      setVerificationErrors(errors);
      return;
    }

    setVerificationErrors({});
    setUploadingImage(true);

    try {
      const orderNumber = `SEO${Date.now().toString().slice(-8)}`;
      const orderItems = cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images[0]
      }));

      const newOrder = {
        orderNumber,
        userId: currentUser?.uid || 'guest_user',
        customerName: addressForm.fullName,
        mobile: addressForm.mobileNumber,
        items: orderItems,
        address: addressForm,
        amount: orderAmount,
        paymentScreenshot: verificationForm.screenshotUrl,
        utr: verificationForm.utr,
        createdAt: new Date().toISOString(),
        status: 'pending_verification',
        statusTimeline: [
          { status: 'Pending Verification', time: new Date().toISOString(), note: 'Payment submitted, waiting for administrative verification.' }
        ]
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'orders'), newOrder);
      
      // Also update inventory levels (decrease stock) for each product
      for (const item of cart) {
        // Decrease stock
        const prodRef = doc(db, 'products', item.product.id);
        const newStock = Math.max(0, item.product.stock - item.quantity);
        await updateDoc(prodRef, {
          stock: newStock,
          isOutOfStock: newStock === 0
        });
      }

      setCreatedOrderId(docRef.id);
      setCreatedOrderNumber(orderNumber);
      setSuccessAmount(orderAmount);
      clearCart();
      setStep('success');
      showToast('Order placed successfully!', 'success');
    } catch (err) {
      console.error('Error placing order: ', err);
      showToast('Failed to submit order. Please retry.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2 mb-8 md:mb-12">
        <div className={`flex items-center gap-1 text-xs font-sans font-bold ${step === 'address' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step === 'address' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>1</span>
          <span>Address</span>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300" />
        <div className={`flex items-center gap-1 text-xs font-sans font-bold ${step === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>2</span>
          <span>UPI Payment</span>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300" />
        <div className={`flex items-center gap-1 text-xs font-sans font-bold ${step === 'verification' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step === 'verification' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>3</span>
          <span>Verification</span>
        </div>
      </div>

      {/* STEP 1: ADDRESS */}
      {step === 'address' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="font-sans font-extrabold text-lg text-gray-800 mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500 animate-bounce" />
            <span>Delivery Address details</span>
          </h2>
          
          <form onSubmit={handleAddressSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Full Name</label>
              <input
                type="text"
                value={addressForm.fullName}
                onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
              />
              {addressErrors.fullName && <p className="text-red-500 text-xxs font-sans mt-1">{addressErrors.fullName}</p>}
            </div>

            <div>
              <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">10-Digit Mobile Number</label>
              <input
                type="tel"
                value={addressForm.mobileNumber}
                onChange={(e) => setAddressForm({ ...addressForm, mobileNumber: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
              />
              {addressErrors.mobileNumber && <p className="text-red-500 text-xxs font-sans mt-1">{addressErrors.mobileNumber}</p>}
            </div>

            <div>
              <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">House / Apartment No.</label>
              <input
                type="text"
                placeholder="Flat 102, Building 3"
                value={addressForm.houseNumber}
                onChange={(e) => setAddressForm({ ...addressForm, houseNumber: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
              />
              {addressErrors.houseNumber && <p className="text-red-500 text-xxs font-sans mt-1">{addressErrors.houseNumber}</p>}
            </div>

            <div>
              <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Street / Locality</label>
              <input
                type="text"
                placeholder="Civil Lines"
                value={addressForm.street}
                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
              />
              {addressErrors.street && <p className="text-red-500 text-xxs font-sans mt-1">{addressErrors.street}</p>}
            </div>

            <div>
              <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">City</label>
              <input
                type="text"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
              />
              {addressErrors.city && <p className="text-red-500 text-xxs font-sans mt-1">{addressErrors.city}</p>}
            </div>

            <div>
              <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">State</label>
              <input
                type="text"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
              />
              {addressErrors.state && <p className="text-red-500 text-xxs font-sans mt-1">{addressErrors.state}</p>}
            </div>

            <div>
              <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Pincode (6-Digit)</label>
              <input
                type="text"
                maxLength={6}
                value={addressForm.pincode}
                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
              />
              {addressErrors.pincode && <p className="text-red-500 text-xxs font-sans mt-1">{addressErrors.pincode}</p>}
            </div>

            <div>
              <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Landmark (Optional)</label>
              <input
                type="text"
                placeholder="Near Temple"
                value={addressForm.landmark}
                onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
              />
            </div>

            <button
              type="submit"
              className="mt-4 sm:col-span-2 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-sm rounded-xl shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
            >
              Continue to UPI Payment
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: UPI PAYMENT */}
      {step === 'payment' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="font-sans font-extrabold text-lg text-gray-800 flex items-center justify-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <span>Direct UPI Payment ONLY</span>
            </h2>
            <p className="font-sans text-xs text-gray-400">
              Pay securely via any installed UPI application using the QR code or direct deep link button below.
            </p>

            {/* Price banner */}
            <div className="bg-blue-50 p-4 border border-blue-100 rounded-2xl">
              <div className="font-sans text-xxs font-bold text-gray-400 uppercase">Total Amount Due</div>
              <div className="font-mono text-2xl font-extrabold text-blue-600 mt-1">{formatINR(orderAmount)}</div>
            </div>

            {/* QR Code Container */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm w-fit mx-auto">
              <img 
                src={websiteSettings?.upiQrCode || qrCodeUrl} 
                alt="UPI QR" 
                className="w-48 h-48 object-contain" 
                referrerPolicy="no-referrer"
              />
              <p className="font-sans text-[10px] text-gray-400 mt-2 font-semibold">Scan with GPay, PhonePe, Paytm or BHIM</p>
            </div>

            {/* UPI ID Copy Box */}
            <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <div className="text-left font-sans">
                <div className="text-[10px] text-gray-400 font-bold uppercase">UPI Address</div>
                <div className="text-xs font-semibold text-gray-700 font-mono mt-0.5">{upiId}</div>
              </div>
              <button 
                onClick={copyToClipboard}
                className="p-2 bg-white hover:bg-gray-100 border border-gray-100 rounded-lg text-gray-500 transition-colors"
              >
                {isCopyingUpi ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <div className="text-left bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-2 text-xs font-sans text-amber-800">
              <h4 className="font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Receiver Verification:</span>
              </h4>
              <p className="text-xxs leading-relaxed">
                Ensure the verification name inside your UPI app shows <strong className="font-bold text-gray-800">{upiName}</strong>. Please note down or screenshot your 12-digit UTR/Transaction ID, as it is required on the next step to verify and approve order shipment.
              </p>
            </div>

            {/* Open UPI App deep link */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              <a
                href={upiDeepLink}
                className="relative group overflow-hidden py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-sans font-bold text-sm rounded-xl shadow-lg shadow-blue-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {/* Reflective sweep shine */}
                <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                  <span className="absolute -inset-y-4 -inset-x-12 w-8 bg-white/20 blur-sm transform rotate-30 animate-[sweep_3s_infinite_ease-in-out]" />
                </span>
                <Sparkles className="h-4.5 w-4.5 text-amber-300 animate-bounce" />
                <span>Pay via UPI App</span>
              </a>

              <button
                onClick={() => setStep('verification')}
                className="py-3.5 bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-600 font-sans font-bold text-xs rounded-xl active:scale-95 transition-all"
              >
                I have Paid, Continue to Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PAYMENT VERIFICATION */}
      {step === 'verification' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="font-sans font-extrabold text-lg text-gray-800 mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-pulse" />
            <span>Order Payment Verification</span>
          </h2>

          <form onSubmit={handleVerificationSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">UPI / Contact Number used</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={verificationForm.contactNumber}
                  onChange={(e) => setVerificationForm({ ...verificationForm, contactNumber: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
                />
                {verificationErrors.contactNumber && <p className="text-red-500 text-xxs font-sans mt-1">{verificationErrors.contactNumber}</p>}
              </div>

              <div>
                <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">12-Digit Transaction Reference (UTR)</label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="e.g. 123456789012"
                  value={verificationForm.utr}
                  onChange={(e) => setVerificationForm({ ...verificationForm, utr: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm font-mono"
                />
                {verificationErrors.utr && <p className="text-red-500 text-xxs font-sans mt-1">{verificationErrors.utr}</p>}
              </div>
            </div>

            {/* Custom Payment Screenshot File Uploader */}
            <div>
              <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Upload Payment Screenshot</label>
              <div className="border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-gray-50/50 transition-all relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="space-y-1">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="font-sans text-xs font-semibold text-gray-600">
                    {screenshotFile ? screenshotFile.name : 'Click to upload or drag & drop payment screenshot'}
                  </p>
                  <p className="font-sans text-[10px] text-gray-400">JPEG, PNG up to 5MB</p>
                </div>
              </div>
              {uploadingImage && <p className="text-blue-500 text-xxs font-sans mt-2 animate-pulse">Uploading file directly to Firebase Storage...</p>}
              {verificationForm.screenshotUrl && <p className="text-emerald-500 text-xxs font-sans mt-2 flex items-center gap-1">✓ Screenshot synced successfully.</p>}
              {verificationErrors.screenshot && <p className="text-red-500 text-xxs font-sans mt-1">{verificationErrors.screenshot}</p>}
            </div>

            {/* Instructions box with screenshot description */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 sm:p-5 space-y-3">
              <h4 className="font-sans font-bold text-xs text-gray-700 flex items-center gap-1.5">
                <HelpCircle className="h-4.5 w-4.5 text-blue-500" />
                <span>Where is my 12-Digit UTR?</span>
              </h4>
              <p className="font-sans text-xxs text-gray-500 leading-relaxed">
                A 12-digit reference or UTR is generated on every UPI payment inside GPay, PhonePe or Paytm. It typically appears right under your payment transaction receipt marked as <strong className="font-bold text-gray-800">"UPI Ref No."</strong>, <strong className="font-bold text-gray-800">"UTR"</strong>, or <strong className="font-bold text-gray-800">"Transaction ID"</strong>. Please upload a clear receipt showing this number for fast auto-verification.
              </p>
            </div>

            <button
              type="submit"
              disabled={uploadingImage}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-sans font-bold text-sm rounded-xl shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
            >
              {uploadingImage ? 'Uploading Screenshot...' : 'Submit Order Verification'}
            </button>
          </form>
        </div>
      )}

      {/* STEP 4: SUCCESS CONFIRMATION */}
      {step === 'success' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-sm text-center max-w-lg mx-auto space-y-6">
          <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce border border-emerald-100">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h2 className="font-sans font-extrabold text-xl sm:text-2xl text-gray-800">Order Submitted Successfully!</h2>
            <p className="font-sans text-xs text-gray-400">
              Your order reference is <strong className="font-mono text-blue-600 font-bold">{createdOrderNumber}</strong>. Our administrators are currently verifying your payment screenshot and UTR.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left text-xs font-sans text-gray-500 space-y-2 leading-relaxed">
            <div><strong className="text-gray-700">Payment Status:</strong> <span className="font-bold text-amber-600">Pending Verification</span></div>
            <div><strong className="text-gray-700">Delivery Address:</strong> {addressForm.houseNumber}, {addressForm.street}, {addressForm.city}, {addressForm.state} - {addressForm.pincode}</div>
            <p className="text-xxs text-gray-400 mt-2">
              Updates about order processing, packing, shipping, and delivery status will appear on your Profile and Order Tracking page. We also notify verified mobile contact numbers via helpline call/WhatsApp.
            </p>
          </div>

          {/* WhatsApp Verification Prompt */}
          {(() => {
            const rawWhatsApp = websiteSettings?.contactNumbers?.[1] || '+91 93197 84706';
            const cleanWhatsApp = rawWhatsApp.replace(/[^\d]/g, ''); // keeps only digits
            const whatsappText = `Hello Sethi Electronics, I have completed my transaction and uploaded my payment screenshot.\n\n*Order Details:*\n- *Order ID:* ${createdOrderNumber}\n- *Amount Paid:* ₹${successAmount.toLocaleString('en-IN')}\n- *UTR Number:* ${verificationForm.utr}\n\nPlease verify my payment receipt and update my order status. Thank you!`;
            const waUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(whatsappText)}`;

            return (
              <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-5 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-800">
                  <MessageCircle className="h-5 w-5 text-emerald-600 animate-pulse" />
                  <span className="font-sans font-extrabold text-sm">Instant WhatsApp Verification</span>
                </div>
                <p className="font-sans text-xs text-emerald-700/90 leading-relaxed max-w-sm mx-auto">
                  To speed up manual review and get your receipt verified instantly, click below to share your payment UTR and receipt details with our WhatsApp Helpline. The admin will respond directly!
                </p>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  <MessageCircle className="h-4 w-4 fill-white" />
                  <span>Verify & Chat on WhatsApp</span>
                </a>
              </div>
            );
          })()}

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Link
              to="/profile?tab=orders"
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs rounded-xl shadow-md text-center"
            >
              Track Order Status
            </Link>
            <Link
              to="/"
              className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-150 text-gray-600 font-sans font-bold text-xs rounded-xl text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
