'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
// Inline icon components (no external dependency)
const Check = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
)
const ChevronLeft = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
)
const ChevronRight = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
)
const Plus = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
)
const XIcon = ({ size = 18, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
)
const ImageIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
)

interface TicketType {
  id: string
  name: string
  price: number
  quantity: number
}

interface FormData {
  title: string
  description: string
  venue: string
  date: string
  ticketTypes: TicketType[]
  isPublished: boolean
  socialInstagram: string
  socialX: string
  socialTiktok: string
  socialWebsite: string
}

const STEPS = [
  { id: 1, label: 'Details' },
  { id: 2, label: 'Date & Venue' },
  { id: 3, label: 'Tickets' },
  { id: 4, label: 'Review' },
]

export default function CreateEventForm({ userId }: { userId: string }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    venue: '',
    date: '',
    ticketTypes: [{ id: '1', name: '', price: 0, quantity: 0 }],
    isPublished: false,
    socialInstagram: '',
    socialX: '',
    socialTiktok: '',
    socialWebsite: '',
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }
    setCoverImage(file)
    setCoverPreview(URL.createObjectURL(file))
    setError('')
  }

  const removeImage = () => {
    setCoverImage(null)
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!coverImage) return null
    setUploadingImage(true)
    const supabase = createClient()
    const ext = coverImage.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(path, coverImage, { upsert: true })
    setUploadingImage(false)
    if (uploadError) {
      console.error('Image upload failed:', uploadError)
      return null
    }
    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(path)
    return publicUrl
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.currentTarget
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.currentTarget
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleTicketChange = (id: string, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      ticketTypes: prev.ticketTypes.map(ticket =>
        ticket.id === id
          ? { ...ticket, [field]: field === 'name' ? value : parseFloat(String(value)) || 0 }
          : ticket
      ),
    }))
  }

  const addTicketType = () => {
    const newId = String(Math.max(...formData.ticketTypes.map(t => parseInt(t.id)), 0) + 1)
    setFormData(prev => ({
      ...prev,
      ticketTypes: [...prev.ticketTypes, { id: newId, name: '', price: 0, quantity: 0 }],
    }))
  }

  const removeTicketType = (id: string) => {
    if (formData.ticketTypes.length > 1) {
      setFormData(prev => ({
        ...prev,
        ticketTypes: prev.ticketTypes.filter(t => t.id !== id),
      }))
    }
  }

  const getTotalCapacity = () => {
    return formData.ticketTypes.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0)
  }

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) {
          setError('Event title is required')
          return false
        }
        return true
      case 2:
        if (!formData.venue.trim()) {
          setError('Venue is required')
          return false
        }
        if (!formData.date) {
          setError('Date & time is required')
          return false
        }
        return true
      case 3:
        if (formData.ticketTypes.some(t => !t.name.trim() || t.price === 0 || t.quantity === 0)) {
          setError('All ticket types must have a name, price, and quantity')
          return false
        }
        return true
      case 4:
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    setError('')
    if (validateStep()) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handleBack = () => {
    setError('')
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep) {
      setError('')
      setCurrentStep(stepId)
    }
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      // Upload cover image first if selected
      const coverImageUrl = await uploadImage()

      const payload = {
        title: formData.title,
        description: formData.description || null,
        venue: formData.venue,
        date: formData.date,
        ticketTypes: formData.ticketTypes.map(t => ({
          name: t.name,
          price: Math.round(t.price * 100), // Convert pounds to pence
          quantity: t.quantity,
        })),
        isPublished: formData.isPublished,
        organiserId: userId,
        coverImageUrl,
        socialInstagram: formData.socialInstagram || null,
        socialX: formData.socialX || null,
        socialTiktok: formData.socialTiktok || null,
        socialWebsite: formData.socialWebsite || null,
      }

      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create event')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-white font-mono placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
  const labelClass = "block text-sm text-white/70 mb-1.5 font-mono uppercase tracking-wider"

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Progress Indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => handleStepClick(step.id)}
                disabled={step.id > currentStep}
                className={`relative flex items-center justify-center w-10 h-10 rounded-none font-semibold transition-all border-2 ${
                  step.id < currentStep
                    ? 'bg-white text-black cursor-pointer hover:bg-white/90 border-white'
                    : step.id === currentStep
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-800 text-white/50 cursor-not-allowed border-zinc-700'
                }`}
              >
                {step.id < currentStep ? <Check size={20} /> : step.id}
              </button>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                    step.id < currentStep ? 'bg-white' : 'bg-zinc-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-white/50">
          {STEPS.map(step => (
            <span key={step.id} className={step.id === currentStep ? 'text-white' : ''}>
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-zinc-900 border-2 border-white/20 rounded-none grain relative p-8 mb-8">
        {/* Step 1: Event Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-mono uppercase tracking-widest text-white mb-6">Event details</h2>
              <div>
                <label className={labelClass}>Event title</label>
                <input
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Summer Gathering 2025"
                  className={inputClass}
                />
              </div>
              <div className="mt-6">
                <label className={labelClass}>Description</label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell people what to expect…"
                  className={inputClass + ' resize-none'}
                />
              </div>

              {/* Cover Image Upload */}
              <div className="mt-6">
                <label className={labelClass}>Cover image / flyer</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {coverPreview ? (
                  <div className="relative group">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-48 object-cover rounded-none border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors"
                    >
                      <XIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-none"
                    >
                      <span className="text-white text-sm font-medium">Change image</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-white/10 rounded-none flex flex-col items-center justify-center gap-3 text-white/30 hover:border-white/20 hover:text-white/50 transition-colors"
                  >
                    <ImageIcon size={32} />
                    <div className="text-sm">Click to upload a cover image or flyer</div>
                    <div className="text-xs text-white/20">PNG, JPG up to 5MB</div>
                  </button>
                )}
              </div>

              {/* Social Links */}
              <div className="mt-6">
                <label className={labelClass}>Social links</label>
                <p className="text-xs text-white/30 mb-3">Optional — displayed on your event page</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 text-sm w-20 shrink-0">Instagram</span>
                    <input
                      name="socialInstagram"
                      type="text"
                      value={formData.socialInstagram}
                      onChange={handleInputChange}
                      placeholder="@youraccount"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 text-sm w-20 shrink-0">X / Twitter</span>
                    <input
                      name="socialX"
                      type="text"
                      value={formData.socialX}
                      onChange={handleInputChange}
                      placeholder="@youraccount"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 text-sm w-20 shrink-0">TikTok</span>
                    <input
                      name="socialTiktok"
                      type="text"
                      value={formData.socialTiktok}
                      onChange={handleInputChange}
                      placeholder="@youraccount"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 text-sm w-20 shrink-0">Website</span>
                    <input
                      name="socialWebsite"
                      type="url"
                      value={formData.socialWebsite}
                      onChange={handleInputChange}
                      placeholder="https://yoursite.com"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Date & Venue */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-mono uppercase tracking-widest text-white mb-6">Date & venue</h2>
              <div className="space-y-6">
                <div>
                  <label className={labelClass}>Venue</label>
                  <input
                    name="venue"
                    type="text"
                    value={formData.venue}
                    onChange={handleInputChange}
                    placeholder="The Forum, London"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Date & time</label>
                  <input
                    name="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={handleInputChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Tickets */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-mono uppercase tracking-widest text-white mb-6">Ticket types</h2>
              <div className="space-y-4 mb-6">
                {formData.ticketTypes.map((ticket, idx) => (
                  <div key={ticket.id} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <label className={labelClass}>Ticket name</label>
                      <input
                        type="text"
                        value={ticket.name}
                        onChange={e => handleTicketChange(ticket.id, 'name', e.target.value)}
                        placeholder="e.g. Early Bird"
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className={labelClass}>Price (£)</label>
                      <input
                        type="number"
                        value={ticket.price || ''}
                        onChange={e => handleTicketChange(ticket.id, 'price', e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className={labelClass}>Quantity</label>
                      <input
                        type="number"
                        value={ticket.quantity || ''}
                        onChange={e => handleTicketChange(ticket.id, 'quantity', e.target.value)}
                        placeholder="0"
                        min="0"
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeTicketType(ticket.id)}
                        disabled={formData.ticketTypes.length === 1}
                        className="w-full h-11 rounded-none bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <XIcon size={18} className="mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addTicketType}
                className="w-full mb-6 flex items-center justify-center gap-2 border border-white/10 rounded-none px-4 py-3 text-white/70 uppercase tracking-wider font-mono hover:bg-white/5 transition-colors"
              >
                <Plus size={18} />
                Add ticket type
              </button>

              <div className="bg-white/5 border border-white/10 rounded-none px-4 py-3">
                <div className="text-sm text-white/70 font-mono uppercase tracking-wider">Total capacity across all types:</div>
                <div className="text-2xl font-bold text-white mt-1 font-mono">{getTotalCapacity()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-mono uppercase tracking-widest text-white mb-6">Review your event</h2>

              <div className="space-y-6">
                {coverPreview && (
                  <div>
                    <h3 className="text-sm text-white/70 mb-2 font-mono uppercase tracking-wider">Cover image</h3>
                    <img src={coverPreview} alt="Cover" className="w-full h-48 object-cover rounded-none border border-white/10" />
                  </div>
                )}

                <div>
                  <h3 className="text-sm text-white/70 mb-2 font-mono uppercase tracking-wider">Event title</h3>
                  <p className="text-lg text-white font-mono">{formData.title}</p>
                </div>

                {formData.description && (
                  <div>
                    <h3 className="text-sm text-white/70 mb-2 font-mono uppercase tracking-wider">Description</h3>
                    <p className="text-white whitespace-pre-wrap font-mono">{formData.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm text-white/70 mb-2 font-mono uppercase tracking-wider">Venue</h3>
                    <p className="text-lg text-white font-mono">{formData.venue}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-white/70 mb-2 font-mono uppercase tracking-wider">Date & time</h3>
                    <p className="text-lg text-white">
                      {new Date(formData.date).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-white/70 mb-3 font-mono uppercase tracking-wider">Ticket types</h3>
                  <div className="space-y-2">
                    {formData.ticketTypes.map(ticket => (
                      <div
                        key={ticket.id}
                        className="flex justify-between items-center bg-white/5 border border-white/10 rounded-none px-4 py-3"
                      >
                        <div>
                          <div className="text-white font-medium font-mono">{ticket.name}</div>
                          <div className="text-sm text-white/50 font-mono">
                            {ticket.quantity} tickets available
                          </div>
                        </div>
                        <div className="text-white font-semibold font-mono">£{ticket.price.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 bg-white/5 border border-white/10 rounded-none px-4 py-3">
                    <div className="text-sm text-white/70 font-mono uppercase tracking-wider">Total capacity</div>
                    <div className="text-xl font-bold text-white font-mono">{getTotalCapacity()} tickets</div>
                  </div>
                </div>

                {(formData.socialInstagram || formData.socialX || formData.socialTiktok || formData.socialWebsite) && (
                  <div>
                    <h3 className="text-sm text-white/70 mb-2 font-mono uppercase tracking-wider">Social links</h3>
                    <div className="flex flex-wrap gap-3">
                      {formData.socialInstagram && (
                        <span className="bg-white/5 border border-white/10 rounded-none px-3 py-1.5 text-sm text-white font-mono">
                          Instagram: {formData.socialInstagram}
                        </span>
                      )}
                      {formData.socialX && (
                        <span className="bg-white/5 border border-white/10 rounded-none px-3 py-1.5 text-sm text-white font-mono">
                          X: {formData.socialX}
                        </span>
                      )}
                      {formData.socialTiktok && (
                        <span className="bg-white/5 border border-white/10 rounded-none px-3 py-1.5 text-sm text-white font-mono">
                          TikTok: {formData.socialTiktok}
                        </span>
                      )}
                      {formData.socialWebsite && (
                        <span className="bg-white/5 border border-white/10 rounded-none px-3 py-1.5 text-sm text-white font-mono">
                          Website: {formData.socialWebsite}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-3">
                  <input
                    name="isPublished"
                    id="isPublished"
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-white"
                  />
                  <label htmlFor="isPublished" className="text-sm text-white/70">
                    Publish immediately (visible on the site)
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-none px-4 py-3 font-mono">
            {error}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1 || loading}
          className={`flex items-center gap-2 px-6 py-3 rounded-none font-medium font-mono uppercase tracking-widest transition-colors border-2 ${
            currentStep === 1
              ? 'opacity-0 pointer-events-none'
              : 'border-white/10 text-white/70 hover:bg-white/5 disabled:opacity-50'
          }`}
        >
          <ChevronLeft size={18} />
          Back
        </button>

        <button
          type="button"
          onClick={currentStep === 4 ? handleSubmit : handleNext}
          disabled={loading}
          className="flex items-center gap-2 bg-white text-black font-bold px-8 py-3 rounded-none hover:shadow-[4px_4px_0px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono uppercase tracking-widest border-2 border-white"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin">⏳</span>
              {uploadingImage ? 'Uploading image…' : currentStep === 4 ? 'Creating…' : 'Continue…'}
            </>
          ) : (
            <>
              {currentStep === 4 ? 'Create event' : 'Continue'}
              {currentStep < 4 && <ChevronRight size={18} />}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
