import { useMemo, useState } from 'react'
import './App.css'

const products = [
  {
    id: 1,
    name: 'VEG SALAD BOWL [LEMON]',
    description: 'Rich in Protein and Fiber.',
    image: '/salad1.jpg',
    sizes: [
      { label: 'Small', value: 'small', price: 59 },
      { label: 'Medium', value: 'medium', price: 99 },
      { label: 'Large', value: 'large', price: 159 },
    ],
  },
  {
    id: 2,
    name: 'VEG SALAD WITH MASALA CURD',
    description: 'Rich in Protein And Fiber.',
    image: '/salad.jpg',
    sizes: [
      { label: 'Small', value: 'small', price: 69 },
      { label: 'Medium', value: 'medium', price: 109 },
      { label: 'Large', value: 'large', price: 169 },
    ],
  },
  {
    id: 3,
    name: 'HEALTHY FRUITS DESSERT',
    description: 'No Added Sugar & Cream, Sweetened with Dates.',
    image: '/pie.jpg',
    sizes: [
      { label: 'Small', value: 'small', price: 69 },
      { label: 'Medium', value: 'medium', price: 99 },
      { label: 'Large', value: 'large', price: 119 },
    ],
  },
]

const subscriptionPlans = [
  {
    name: 'VEG SALAD BOWL',
    description: 'Rich in Protein and Fiber',
    image: '/salad1.jpg',
    theme: 'from-green-50 to-teal-50 border-green-200 text-green-600',
    prices: { small: 1550, medium: 2600, large: 4200 },
  },
  {
    name: 'VEG SALAD WITH MASALA CURD',
    description: 'Rich in Protein and Fiber',
    image: '/salad.jpg',
    theme: 'from-orange-50 to-red-50 border-orange-200 text-orange-600',
    prices: { small: 1750, medium: 2800, large: 4400 },
  },
  {
    name: 'HEALTHY FRUITS DESSERT',
    description: 'No Added Sugar & Cream, Sweetened with Dates',
    image: '/pie.jpg',
    theme: 'from-purple-50 to-pink-50 border-purple-200 text-purple-600',
    prices: { small: 1750, medium: 2600, large: 3100 },
  },
]

const SHOP_LOCATION = { lat: 28.58517294897767, lng: 77.07168929283343 }
const MAX_DELIVERY_DISTANCE = 12
const WHATSAPP_NUMBER = '8527594368'

const formatCurrency = (value) => `₹${Number(value).toLocaleString()}`

const calculateApproximateDistance = (point1, point2) => {
  if (
    !point1 ||
    !point2 ||
    typeof point1.lat !== 'number' ||
    typeof point1.lng !== 'number' ||
    typeof point2.lat !== 'number' ||
    typeof point2.lng !== 'number'
  ) {
    return 0
  }

  const R = 6371
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180
  const dLon = ((point2.lng - point1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const straightLineDistance = R * c
  return straightLineDistance * 1.2
}

function App() {
  const [selectedSizes, setSelectedSizes] = useState(() =>
    Object.fromEntries(products.map((product) => [product.id, product.sizes[0].value])),
  )
  const [cart, setCart] = useState([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [codDetails, setCodDetails] = useState({
    name: '',
    mobile: '',
    address: '',
    remark: '',
  })
  const [subscriptionDetails, setSubscriptionDetails] = useState({
    name: '',
    mobile: '',
    address: '',
    remark: '',
  })
  const [deliveryCharge, setDeliveryCharge] = useState(0)
  const [deliveryDistance, setDeliveryDistance] = useState(0)
  const [isDeliveryAvailable, setIsDeliveryAvailable] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [distanceInfo, setDistanceInfo] = useState(
    'Click "Use Current Location" to calculate delivery charge',
  )
  const [distanceError, setDistanceError] = useState('')
  const [message, setMessage] = useState(null)
  const [subscriptionMessage, setSubscriptionMessage] = useState(null)
  const [showCodForm, setShowCodForm] = useState(false)
  const [recentlyAdded, setRecentlyAdded] = useState({})

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  )
  const cartSubtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  )
  const cartTotal = useMemo(() => cartSubtotal + deliveryCharge, [cartSubtotal, deliveryCharge])

  const handleSizeChange = (productId, value) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: value }))
  }

  const handleAddToCart = (product) => {
    const selectedSizeValue = selectedSizes[product.id]
    const sizeData = product.sizes.find((size) => size.value === selectedSizeValue)
    if (!sizeData) return

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.id === product.id && item.size === sizeData.label,
      )
      if (existingIndex !== -1) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        }
        return updated
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          size: sizeData.label,
          price: sizeData.price,
          quantity: 1,
        },
      ]
    })

    setRecentlyAdded((prev) => ({ ...prev, [product.id]: true }))
    setTimeout(() => {
      setRecentlyAdded((prev) => ({ ...prev, [product.id]: false }))
    }, 1000)
  }

  const updateQuantity = (index, change) => {
    setCart((prev) => {
      const updated = [...prev]
      if (!updated[index]) return prev
      updated[index] = { ...updated[index], quantity: updated[index].quantity + change }
      if (updated[index].quantity <= 0) {
        updated.splice(index, 1)
      }
      return updated
    })
  }

  const removeItem = (index) => {
    setCart((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const applyDeliveryCharge = (distance) => {
    if (distance <= MAX_DELIVERY_DISTANCE) {
      let charge
      if (distance < 1) {
        charge = 10
      } else {
        charge = Math.ceil(distance * 10)
        const lastDigit = charge % 10
        if (lastDigit >= 1 && lastDigit <= 5) {
          charge = Math.floor(charge / 10) * 10
        } else if (lastDigit >= 6) {
          charge = Math.ceil(charge / 10) * 10
        }
      }
      setDeliveryCharge(charge)
      setIsDeliveryAvailable(true)
      setDistanceError('')
      setDistanceInfo(`Driving Distance: ${distance.toFixed(1)}km - Delivery Charge: ₹${charge}`)
    } else {
      setDeliveryCharge(0)
      setIsDeliveryAvailable(false)
      setDistanceError('Delivery not available beyond 12km radius')
      setDistanceInfo(`Driving Distance: ${distance.toFixed(1)}km - Beyond delivery range`)
    }
  }

  const calculateCarRouteDistance = async (origin, destination) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return calculateApproximateDistance(origin, destination)
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&mode=driving&key=${apiKey}`
    try {
      const response = await fetch(url)
      const data = await response.json()
      if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
        const distanceText = data.rows[0].elements[0].distance.text
        return parseFloat(distanceText.replace(' km', ''))
      }
      return calculateApproximateDistance(origin, destination)
    } catch (error) {
      console.error('Error fetching route distance:', error)
      return calculateApproximateDistance(origin, destination)
    }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setDistanceInfo('Geolocation is not supported by this browser')
      return
    }
    setIsGettingLocation(true)
    setDistanceError('')
    setDistanceInfo('Getting your location...')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(currentLocation)
        let distance = await calculateCarRouteDistance(SHOP_LOCATION, currentLocation)
        if (!distance || Number.isNaN(distance)) {
          distance = calculateApproximateDistance(SHOP_LOCATION, currentLocation)
        }
        setDeliveryDistance(distance)
        applyDeliveryCharge(distance)
        setIsGettingLocation(false)
      },
      (error) => {
        setIsGettingLocation(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setDistanceInfo('Location access denied. Please enable location permissions.')
            break;
          case error.POSITION_UNAVAILABLE:
            setDistanceInfo('Location information unavailable.')
            break;
          case error.TIMEOUT:
            setDistanceInfo('Location request timed out.')
            break;
          default:
            setDistanceInfo('An unknown error occurred while getting location.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const handleOpenCheckout = () => {
    setIsCheckoutOpen(true)
    setShowCodForm(false)
    setMessage(null)
    setCodDetails({ name: '', mobile: '', address: '', remark: '' })
  }

  const handleShowCodForm = () => {
    if (cart.length === 0) return
    if (!isDeliveryAvailable) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid delivery address within 12km radius first.',
      })
      return
    }
    setShowCodForm(true)
    setMessage(null)
  }

  const handleCodSubmit = (event) => {
    event.preventDefault()
    if (!codDetails.name || !codDetails.mobile || !codDetails.address) {
      setMessage({
        type: 'error',
        text: 'Please fill in all required customer details.',
      })
      return
    }

    const locationLink =
      userLocation && deliveryDistance > 0 && isDeliveryAvailable
        ? `https://www.google.com/maps/search/?api=1&query=${userLocation.lat},${userLocation.lng}`
        : 'https://www.google.com/maps/search/?api=1&query=28.58517294897767,77.07168929283343'

    let orderDetails = "Hello, I'd like to place a Cash on Delivery order!\n\n"
    orderDetails += `*Customer Details:*\n`
    orderDetails += `Name: ${codDetails.name}\n`
    orderDetails += `Mobile: ${codDetails.mobile}\n`
    orderDetails += `Address: ${codDetails.address}\n`
    orderDetails += `Delivery Location: ${locationLink}\n`
    if (codDetails.remark?.trim()) {
      orderDetails += `Special Instructions: ${codDetails.remark}\n`
    }
    orderDetails += `\n`
    orderDetails += `*Order Details:*\n`
    cart.forEach((item) => {
      orderDetails += `${item.quantity} x ${item.name} (${item.size}) - ₹${item.price * item.quantity}\n`
    })
    orderDetails += `Subtotal: ₹${cartSubtotal.toFixed(0)}\n`
    orderDetails += `Delivery Charge: ₹${deliveryCharge} (${deliveryDistance.toFixed(1)}km)\n`
    orderDetails += `Total: ₹${cartTotal.toFixed(0)}`

    const encodedMessage = encodeURIComponent(orderDetails)
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank')

    setMessage({
      type: 'success',
      text: 'Your COD order request has been sent via WhatsApp! We will contact you shortly.',
    })
    setCart([])
    setDeliveryCharge(0)
    setDeliveryDistance(0)
    setIsDeliveryAvailable(false)
    setUserLocation(null)
    setDistanceInfo('Click "Use Current Location" to calculate delivery charge')
    setDistanceError('')
    setShowCodForm(false)
    setCodDetails({ name: '', mobile: '', address: '', remark: '' })
  }

  const handleSubscriptionSubmit = (event) => {
    event.preventDefault()
    if (!currentPlan) return
    if (!subscriptionDetails.name || !subscriptionDetails.mobile || !subscriptionDetails.address) {
      setSubscriptionMessage({
        type: 'error',
        text: 'Please fill in all required customer details.',
      })
      return
    }

    let subscriptionDetailsMessage = "Hello, I'd like to subscribe to your monthly meal plan!\n\n"
    subscriptionDetailsMessage += `*Customer Details:*\n`
    subscriptionDetailsMessage += `Name: ${subscriptionDetails.name}\n`
    subscriptionDetailsMessage += `Mobile: ${subscriptionDetails.mobile}\n`
    subscriptionDetailsMessage += `Address: ${subscriptionDetails.address}\n`
    if (subscriptionDetails.remark?.trim()) {
      subscriptionDetailsMessage += `Special Instructions: ${subscriptionDetails.remark}\n`
    }
    subscriptionDetailsMessage += `\n`
    subscriptionDetailsMessage += `*Subscription Plan Details:*\n`
    subscriptionDetailsMessage += `Plan: ${currentPlan.name}\n`
    subscriptionDetailsMessage += `Description: ${currentPlan.description}\n\n`
    subscriptionDetailsMessage += `*Pricing Options:*\n`
    subscriptionDetailsMessage += `Small: ₹${currentPlan.prices.small.toLocaleString()}\n`
    subscriptionDetailsMessage += `Medium: ₹${currentPlan.prices.medium.toLocaleString()}\n`
    subscriptionDetailsMessage += `Large: ₹${currentPlan.prices.large.toLocaleString()}\n\n`
    subscriptionDetailsMessage += `*Subscription Terms:*\n`
    subscriptionDetailsMessage += `• 30 meals over 45 days\n`
    subscriptionDetailsMessage += `• Flexible delivery schedule\n`
    subscriptionDetailsMessage += `• Please specify your preferred size\n`
    subscriptionDetailsMessage +=
      '• Delivery charges: ₹10 per kilometer (minimum ₹10 for distances less than 1km)\n\n'
    subscriptionDetailsMessage += 'Please confirm the subscription and let me know which size you prefer.'

    const encodedMessage = encodeURIComponent(subscriptionDetailsMessage)
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank')
    setSubscriptionMessage({
      type: 'success',
      text: 'Your subscription request has been sent via WhatsApp! We will contact you shortly.',
    })
    setSubscriptionDetails({ name: '', mobile: '', address: '', remark: '' })
    setCurrentPlan(null)
  }

  const handlePlanSelect = (plan) => {
    setCurrentPlan(plan)
    setIsSubscriptionOpen(true)
    setSubscriptionMessage(null)
    setSubscriptionDetails({ name: '', mobile: '', address: '', remark: '' })
  }

  return (
    <div className="bg-gray-50 text-gray-800">
      <div className="bg-black text-white py-3">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <i className="fas fa-map-marker-alt" />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=28.58517294897767,77.07168929283343"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-teal-200 transition-colors"
                >
                  E-1082 Ground floor Ramphal Chowk Dwarka sector 7 New Delhi 110077
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-phone" />
                <span>+91 8527594368</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-clock" />
                <span>7-11</span>
              </div>
              <a
                href="https://www.instagram.com/goodfuel.life?igsh=MTA1b3R6dXJ2dG5h&utm_source=qr"
                target="_blank"
                rel="noreferrer"
                className="hover:text-teal-200 transition-colors"
              >
                <i className="fab fa-instagram text-xl" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <header className="bg-white shadow-lg py-6 mb-8 sticky top-0 z-40 border-b border-gray-100">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-black font-bold text-xl">GF</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                GoodFuel.<span className="bg-clip-text bg-gradient-to-r from-teal-600 to-teal-500">Life</span>
              </h1>
              <p className="text-sm text-gray-500 -mt-1">Health On Your Plate</p>
            </div>
          </div>
          <nav className="flex items-center space-x-8">
            <a
              href="#products"
              className="hidden md:block text-gray-700 hover:text-teal-600 font-medium transition-all duration-300 hover:scale-105 relative group"
            >
              Products
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-600 transition-all duration-300 group-hover:w-full" />
            </a>
            <a
              href="#subscription"
              className="hidden md:block text-gray-700 hover:text-teal-600 font-medium transition-all duration-300 hover:scale-105 relative group"
            >
              Subscription
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-600 transition-all duration-300 group-hover:w-full" />
            </a>
            <a
              href="#about"
              className="hidden md:block text-gray-700 hover:text-teal-600 font-medium transition-all duration-300 hover:scale-105 relative group"
            >
              About Us
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-600 transition-all duration-300 group-hover:w-full" />
            </a>
            <a
              href="#contact"
              className="hidden md:block text-gray-700 hover:text-teal-600 font-medium transition-all duration-300 hover:scale-105 relative group"
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-600 transition-all duration-300 group-hover:w-full" />
            </a>

            <button
              type="button"
              onClick={handleOpenCheckout}
              className="cart-icon-navbar bg-gradient-to-br from-teal-500 to-teal-600 text-black hover:from-teal-600 hover:to-teal-700 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
              aria-label="Open cart"
            >
              <i className="fas fa-shopping-cart" />
              <span
                className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transition-all duration-300 shadow-lg ${
                  cartCount > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`}
              >
                {cartCount}
              </span>
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section id="hero" className="text-center mb-16 bg-gradient-to-br from-teal-50 to-blue-50 rounded-3xl p-12 shadow-lg">
          <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Health On Your <span className="text-teal-600">Plate</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Delicious, nutritious meals delivered fresh to your door. Fuel your body right, live your best life.
          </p>
          <div className="bg-white border border-teal-200 rounded-2xl p-6 mb-8 max-w-4xl mx-auto shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="flex flex-col items-center space-y-2 text-teal-800">
                <div className="bg-teal-100 p-3 rounded-full">
                  <i className="fas fa-clock text-2xl text-teal-600" />
                </div>
                <span className="font-semibold">Order Timing</span>
                <span className="text-gray-600">7-11</span>
              </div>
              <div className="flex flex-col items-center space-y-2 text-teal-800">
                <div className="bg-teal-100 p-3 rounded-full">
                  <i className="fas fa-truck text-2xl text-teal-600" />
                </div>
                <span className="font-semibold">Delivery Range</span>
                <span className="text-gray-600">Within 12km radius</span>
              </div>
              <div className="flex flex-col items-center space-y-2 text-teal-800">
                <div className="bg-teal-100 p-3 rounded-full">
                  <i className="fas fa-leaf text-2xl text-teal-600" />
                </div>
                <span className="font-semibold">Fresh & Healthy</span>
                <span className="text-gray-600">100% Natural Ingredients</span>
              </div>
            </div>
          </div>
          <a
            href="#products"
            className="btn-primary text-lg px-8 py-4 inline-block shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            Explore Our Menu
          </a>
        </section>

        <section id="products" className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Our Delicious Offerings</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Fresh, healthy meals crafted with care and delivered to your doorstep
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="product-card p-6 shadow-md flex flex-col items-center text-center">
                <img src={product.image} alt={product.name} className="product-image mb-4" />
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h4>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex flex-col space-y-3 w-full mb-6">
                  {product.sizes.map((size) => (
                    <label key={size.value} className="flex items-center space-x-2 text-gray-700">
                      <input
                        type="radio"
                        name={`product-${product.id}-size`}
                        value={size.value}
                        className="form-radio text-teal-600"
                        checked={selectedSizes[product.id] === size.value}
                        onChange={() => handleSizeChange(product.id, size.value)}
                      />
                      <span>
                        {size.label} - {formatCurrency(size.price)}
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={() => handleAddToCart(product)}
                >
                  {recentlyAdded[product.id] ? 'Added!' : 'Add to Cart'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section id="subscription" className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Monthly Subscription Plans</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enjoy 30 meals over a 45-day period with our flexible subscription plans
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.name}
                className={`product-card p-8 shadow-lg text-center bg-gradient-to-br ${plan.theme} border-2`}
              >
                <img src={plan.image} alt={plan.name} className="product-image mb-6" />
                <h4 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h4>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700 font-medium">Small</span>
                    <span className="text-xl font-bold">{formatCurrency(plan.prices.small)}*</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700 font-medium">Medium</span>
                    <span className="text-xl font-bold">{formatCurrency(plan.prices.medium)}*</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Large</span>
                    <span className="text-xl font-bold">{formatCurrency(plan.prices.large)}*</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary w-full py-3 text-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                  onClick={() => handlePlanSelect(plan)}
                >
                  Subscribe Now
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-teal-50 to-blue-50 rounded-3xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h4 className="text-2xl font-bold text-teal-800 mb-4">Why Choose Our Subscription?</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="bg-teal-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <i className="fas fa-calendar-alt text-2xl text-teal-600" />
                </div>
                <h5 className="text-lg font-semibold text-teal-800 mb-2">45-Day Flexibility</h5>
                <p className="text-teal-700 text-sm">Enjoy 30 meals over 45 days at your convenience</p>
              </div>
              <div className="text-center">
                <div className="bg-teal-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <i className="fas fa-percentage text-2xl text-teal-600" />
                </div>
                <h5 className="text-lg font-semibold text-teal-800 mb-2">Best Value</h5>
                <p className="text-teal-700 text-sm">Save more with our subscription pricing</p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-3xl p-8 md:p-12 mb-16 shadow-lg text-center">
          <h3 className="text-4xl font-bold text-teal-800 mb-6">About GoodFuel.Life</h3>
          <p className="text-lg text-teal-700 leading-relaxed max-w-3xl mx-auto mb-8">
            At GoodFuel.Life, we believe that healthy eating should be easy, delicious, and accessible.
            We craft fresh, wholesome meals using the finest ingredients, ensuring every bite nourishes your body and delights your taste buds.
            Our mission is to help you achieve your health goals without compromising on flavor or convenience.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="bg-teal-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-heart text-2xl text-teal-600" />
              </div>
              <h4 className="text-xl font-semibold text-teal-800 mb-2">Health First</h4>
              <p className="text-teal-700">Every ingredient is carefully selected for its nutritional value</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="bg-teal-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-star text-2xl text-teal-600" />
              </div>
              <h4 className="text-xl font-semibold text-teal-800 mb-2">Premium Quality</h4>
              <p className="text-teal-700">We use only the finest, freshest ingredients available</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="bg-teal-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-truck text-2xl text-teal-600" />
              </div>
              <h4 className="text-xl font-semibold text-teal-800 mb-2">Fast Delivery</h4>
              <p className="text-teal-700">Quick and reliable delivery within 12km radius</p>
            </div>
          </div>
        </section>

        <section id="contact" className="text-center mb-16 bg-white rounded-3xl p-8 md:p-12 shadow-lg">
          <h3 className="text-4xl font-bold text-gray-900 mb-6">Get in Touch</h3>
          <p className="text-lg text-gray-700 mb-8">Have questions or special requests? Reach out to us!</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
            <div className="bg-teal-50 p-6 rounded-2xl border border-teal-200">
              <div className="bg-teal-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-phone-alt text-2xl text-teal-600" />
              </div>
              <h4 className="text-xl font-semibold text-teal-800 mb-2">Call Us</h4>
              <p className="text-teal-700 text-lg">+91 8527594368</p>
            </div>
            <div className="bg-teal-50 p-6 rounded-2xl border border-teal-200">
              <div className="bg-teal-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-map-marker-alt text-2xl text-teal-600" />
              </div>
              <h4 className="text-xl font-semibold text-teal-800 mb-2">Visit Us</h4>
              <a
                href="https://www.google.com/maps/search/?api=1&query=28.58517294897767,77.07168929283343"
                target="_blank"
                rel="noreferrer"
                className="text-teal-700 hover:text-teal-800 transition-colors"
              >
                <p className="text-sm">E-1082 Ground floor Ramphal Chowk Dwarka sector 7 New Delhi 110077</p>
              </a>
            </div>
          </div>
          <div className="flex justify-center">
            <a
              href="https://www.instagram.com/goodfuel.life?igsh=MTA1b3R6dXJ2dG5h&utm_source=qr"
              target="_blank"
              rel="noreferrer"
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-110"
            >
              <i className="fab fa-instagram text-3xl" />
            </a>
          </div>
        </section>

        <section className="text-center mb-16 bg-gradient-to-r from-teal-50 to-blue-50 rounded-3xl p-8 md:p-12 shadow-lg">
          <h3 className="text-4xl font-bold text-teal-800 mb-6">Franchise Opportunity</h3>
          <p className="text-lg text-teal-700 leading-relaxed max-w-3xl mx-auto mb-8">
            Join the GoodFuel.Life family! We're looking for passionate entrepreneurs to help us spread healthy eating across the city.
          </p>
          <div className="bg-white p-6 rounded-2xl shadow-md max-w-2xl mx-auto">
            <div className="bg-teal-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <i className="fas fa-handshake text-3xl text-teal-600" />
            </div>
            <h4 className="text-2xl font-semibold text-teal-800 mb-4">Franchise Available</h4>
            <p className="text-teal-700 mb-6">Contact us for franchise enquiry and call on the same number already given</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="tel:+918527594368"
                className="btn-primary text-lg px-6 py-3 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                <i className="fas fa-phone mr-2" />
                Call for Franchise
              </a>
              <a
                href="https://wa.me/918527594368?text=Hi, I'm interested in franchise opportunity with GoodFuel.Life"
                target="_blank"
                rel="noreferrer"
                className="whatsapp-btn text-lg px-6 py-3 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                <i className="fab fa-whatsapp mr-2" />
                WhatsApp Enquiry
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h4 className="text-xl font-bold text-teal-400 mb-4">GoodFuel.Life</h4>
              <p className="text-gray-300">Health on your plate, delivered fresh to your door.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-teal-400 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="#products" className="hover:text-teal-400 transition-colors">
                    Our Menu
                  </a>
                </li>
                <li>
                  <a href="#subscription" className="hover:text-teal-400 transition-colors">
                    Subscription
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-teal-400 transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-teal-400 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold text-teal-400 mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-300">
                <p>+91 8527594368</p>
                <p>7-11</p>
                <p>Within 12km radius</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 GoodFuel.Life. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {isCheckoutOpen && (
        <div
          className="modal flex"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsCheckoutOpen(false)
            }
          }}
        >
          <div className="modal-content">
            <button type="button" className="close-button" onClick={() => setIsCheckoutOpen(false)}>
              &times;
            </button>
            <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">Your Cart</h3>
            <div className="mb-6 max-h-60 overflow-y-auto pr-2 space-y-3">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center">Your cart is empty.</p>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="flex justify-between items-center py-2 border-b border-gray-100"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.name} <span className="text-sm text-gray-500">({item.size})</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        ₹{item.price} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-red-500 hover:text-red-700 text-lg"
                        onClick={() => updateQuantity(index, -1)}
                        type="button"
                      >
                        <i className="fas fa-minus-circle" />
                      </button>
                      <span className="text-gray-800 font-semibold">{item.quantity}</span>
                      <button
                        className="text-green-500 hover:text-green-700 text-lg"
                        onClick={() => updateQuantity(index, 1)}
                        type="button"
                      >
                        <i className="fas fa-plus-circle" />
                      </button>
                      <button
                        className="ml-3 text-gray-400 hover:text-red-500"
                        onClick={() => removeItem(index)}
                        type="button"
                      >
                        <i className="fas fa-trash-alt" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-800">₹{cartSubtotal.toFixed(0)}</span>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Delivery Location</label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="text-sm text-teal-600 hover:text-teal-800 font-medium disabled:opacity-50"
                  disabled={isGettingLocation}
                >
                  <i className="fas fa-location-arrow mr-1" />
                  {isGettingLocation ? 'Getting location...' : 'Use Current Location'}
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-600">{distanceInfo}</div>
              {distanceError && <div className="mt-2 text-sm text-red-600">{distanceError}</div>}
              {isGettingLocation && (
                <div className="mt-2 text-sm text-blue-600">
                  <i className="fas fa-spinner fa-spin mr-1" />
                  Getting your location...
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
              <span className="text-gray-600">Delivery Charge:</span>
              <span className="text-gray-800">₹{deliveryCharge}</span>
            </div>
            <div className="flex justify-between items-center mb-6 border-t pt-4 border-gray-200">
              <span className="text-xl font-bold text-gray-800">Total:</span>
              <span className="text-xl font-bold text-teal-600">₹{cartTotal.toFixed(0)}</span>
            </div>

            {message && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  message.type === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {message.text}
              </div>
            )}

            {!showCodForm && (
              <div className="flex flex-col space-y-4 mb-6">
                <h4 className="text-xl font-semibold text-gray-800 mb-4">Choose your option:</h4>
                <button
                  type="button"
                  onClick={handleShowCodForm}
                  className="btn-primary w-full py-3 shadow-md hover:shadow-lg disabled:opacity-60"
                  disabled={cart.length === 0}
                >
                  Cash on Delivery
                </button>
              </div>
            )}

            {showCodForm && (
              <div>
                <h4 className="text-xl font-semibold text-gray-800 mb-4">
                  Cash on Delivery Details (Will be sent to WhatsApp):
                </h4>
                <form className="space-y-4" onSubmit={handleCodSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="customerName">
                      Name
                    </label>
                    <input
                      id="customerName"
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2"
                      value={codDetails.name}
                      onChange={(event) => setCodDetails({ ...codDetails, name: event.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="customerMobile">
                      Mobile Number
                    </label>
                    <input
                      id="customerMobile"
                      type="tel"
                      pattern="[0-9]{10}"
                      title="Please enter a 10-digit mobile number"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2"
                      value={codDetails.mobile}
                      onChange={(event) => setCodDetails({ ...codDetails, mobile: event.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="customerAddress">
                      Delivery Address
                    </label>
                    <textarea
                      id="customerAddress"
                      rows="3"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2"
                      value={codDetails.address}
                      onChange={(event) =>
                        setCodDetails({ ...codDetails, address: event.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="customerRemark">
                      Special Instructions/Remarks <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <textarea
                      id="customerRemark"
                      rows="2"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2"
                      value={codDetails.remark}
                      onChange={(event) =>
                        setCodDetails({ ...codDetails, remark: event.target.value })
                      }
                      placeholder="Any special instructions or notes for your order..."
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      className="btn-secondary flex-1 py-3 shadow-md hover:shadow-lg"
                      onClick={() => {
                        setShowCodForm(false)
                        setMessage(null)
                      }}
                    >
                      <i className="fas fa-arrow-left mr-2" />
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1 py-3 shadow-md hover:shadow-lg"
                    >
                      Send COD Order to WhatsApp
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {isSubscriptionOpen && (
        <div
          className="modal flex"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsSubscriptionOpen(false)
            }
          }}
        >
          <div className="modal-content">
            <button
              type="button"
              className="close-button"
              onClick={() => setIsSubscriptionOpen(false)}
              aria-label="Close subscription modal"
            >
              &times;
            </button>
            <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Subscribe to <span>{currentPlan?.name || 'Plan'}</span>
            </h3>
            {currentPlan && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                <h4 className="text-xl font-semibold text-gray-800 mb-2">{currentPlan.name}</h4>
                <p className="text-gray-600">{currentPlan.description}</p>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-teal-600">
                    {formatCurrency(currentPlan.prices.small)}
                  </span>
                  <span className="text-gray-600 ml-2">for 30 meals over 45 days</span>
                </div>
                <div className="mt-4 text-sm text-gray-700 space-y-1">
                  <div>Small: {formatCurrency(currentPlan.prices.small)}</div>
                  <div>Medium: {formatCurrency(currentPlan.prices.medium)}</div>
                  <div>Large: {formatCurrency(currentPlan.prices.large)}</div>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xl font-semibold text-gray-800 mb-4">
                Subscription Details (Will be sent to WhatsApp):
              </h4>
              {subscriptionMessage && (
                <div
                  className={`mb-4 p-4 rounded-lg ${
                    subscriptionMessage.type === 'error'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {subscriptionMessage.text}
                </div>
              )}
              <form className="space-y-4" onSubmit={handleSubscriptionSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="subscriptionCustomerName">
                    Name
                  </label>
                  <input
                    id="subscriptionCustomerName"
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2"
                    value={subscriptionDetails.name}
                    onChange={(event) =>
                      setSubscriptionDetails({ ...subscriptionDetails, name: event.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="subscriptionCustomerMobile">
                    Mobile Number
                  </label>
                  <input
                    id="subscriptionCustomerMobile"
                    type="tel"
                    pattern="[0-9]{10}"
                    title="Please enter a 10-digit mobile number"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2"
                    value={subscriptionDetails.mobile}
                    onChange={(event) =>
                      setSubscriptionDetails({ ...subscriptionDetails, mobile: event.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700"
                    htmlFor="subscriptionCustomerAddress"
                  >
                    Delivery Address
                  </label>
                  <textarea
                    id="subscriptionCustomerAddress"
                    rows="3"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2"
                    value={subscriptionDetails.address}
                    onChange={(event) =>
                      setSubscriptionDetails({ ...subscriptionDetails, address: event.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700"
                    htmlFor="subscriptionCustomerRemark"
                  >
                    Special Instructions/Remarks <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <textarea
                    id="subscriptionCustomerRemark"
                    rows="2"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2"
                    value={subscriptionDetails.remark}
                    onChange={(event) =>
                      setSubscriptionDetails({ ...subscriptionDetails, remark: event.target.value })
                    }
                    placeholder="Any special instructions or notes for your subscription..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    className="btn-secondary flex-1 py-3 shadow-md hover:shadow-lg"
                    onClick={() => setIsSubscriptionOpen(false)}
                  >
                    <i className="fas fa-arrow-left mr-2" />
                    Back
                  </button>
                  <button type="submit" className="btn-primary flex-1 py-3 shadow-md hover:shadow-lg">
                    Send Subscription to WhatsApp
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
