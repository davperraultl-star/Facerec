import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Phone,
  Stethoscope,
  ClipboardList,
  MessageSquare,
  FileCheck,
  Camera,
  Heart,
  Loader2
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const MEDICAL_CONDITIONS = [
  'Acne',
  'Arthritis',
  'Autoimmune disorder',
  'Blood disorder',
  'Cancer (or radiation therapy)',
  "Cow's milk protein allergy",
  'Diabetes (or diabetic neuropathy)',
  'Epilepsy',
  'Herpes (or cold sores)',
  'Hirsutism',
  'Hormonal imbalance',
  'Keloid scars (or other scars)',
  'Kidney disease',
  'Local anesthetic sensitivity',
  'Melanoma',
  'Polycystic ovarian syndrome',
  'Port wine stain',
  'Psoriasis',
  'Steroids (or hormonal therapy)',
  'Shingles',
  'Skin pigmentation',
  'Vitiligo'
]

const TREATMENT_INTERESTS = [
  'Treating fine lines & wrinkles',
  'Treating facial volume loss',
  'Treating gummy smiles',
  'Treating uneven lip position',
  'Treating migraine/headaches',
  'Treating TMD/TMJ',
  'Treatment of age spots',
  'Improving skin tone',
  'Treating stubborn body fat',
  'Hair removal',
  'Smile makeover'
]

const REFERRAL_SOURCES = [
  "Doctor's referral",
  'Friend or current patient',
  'Seminar or Tradeshow',
  'Newspaper',
  'Website or Internet',
  'Promotion or Coupon',
  'Yellow Pages',
  'Magazine',
  'Walk by',
  'Other'
]

export function RegisterPatient(): React.JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [quickRegister, setQuickRegister] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [sex, setSex] = useState('')
  const [birthday, setBirthday] = useState('')
  const [ethnicity, setEthnicity] = useState('')
  const [email, setEmail] = useState('')
  const [homePhone, setHomePhone] = useState('')
  const [cellPhone, setCellPhone] = useState('')
  const [workPhone, setWorkPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [medicalConditions, setMedicalConditions] = useState<string[]>([])
  const [familyPhysician, setFamilyPhysician] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [pastIllnesses, setPastIllnesses] = useState('')
  const [currentMedications, setCurrentMedications] = useState('')
  const [conditionsBeingTreated, setConditionsBeingTreated] = useState('')
  const [previousSpecialistTreatment, setPreviousSpecialistTreatment] = useState(false)
  const [pregnantOrBreastfeeding, setPregnantOrBreastfeeding] = useState(false)
  const [smoker, setSmoker] = useState(false)
  const [referralSources, setReferralSources] = useState<string[]>([])
  const [treatmentInterests, setTreatmentInterests] = useState<string[]>([])
  const [botulinumToxinConsent, setBotulinumToxinConsent] = useState('')
  const [photoConsent, setPhotoConsent] = useState('')

  function toggleArrayItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()

    if (!firstName.trim() || !lastName.trim()) return

    setSaving(true)
    try {
      const patient = await window.api.patients.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        sex: sex || undefined,
        birthday: birthday || undefined,
        ethnicity: ethnicity || undefined,
        email: email || undefined,
        homePhone: homePhone || undefined,
        cellPhone: cellPhone || undefined,
        workPhone: workPhone || undefined,
        address: address || undefined,
        city: city || undefined,
        postalCode: postalCode || undefined,
        medicalConditions: medicalConditions.length > 0 ? medicalConditions : undefined,
        familyPhysician: familyPhysician || undefined,
        weight: weight || undefined,
        height: height || undefined,
        pastIllnesses: pastIllnesses || undefined,
        currentMedications: currentMedications || undefined,
        conditionsBeingTreated: conditionsBeingTreated || undefined,
        previousSpecialistTreatment: previousSpecialistTreatment || undefined,
        pregnantOrBreastfeeding: pregnantOrBreastfeeding || undefined,
        smoker: smoker || undefined,
        referralSources: referralSources.length > 0 ? referralSources : undefined,
        treatmentInterests: treatmentInterests.length > 0 ? treatmentInterests : undefined,
        botulinumToxinConsent: botulinumToxinConsent || undefined,
        photoConsent: photoConsent || undefined,
        quickRegister
      })

      navigate(`/patients/${patient.id}`)
    } catch (err) {
      console.error('Failed to register patient:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70 mb-1">
            New Patient
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{t('nav.register')}</h1>
        </div>
        <label className="flex items-center gap-2.5 text-[13px] text-muted-foreground cursor-pointer select-none group">
          <span className="group-hover:text-foreground transition-colors">Quick register</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={quickRegister}
              onChange={(e) => setQuickRegister(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-border rounded-full peer-checked:bg-primary transition-colors duration-200" />
            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-foreground rounded-full transition-transform duration-200 peer-checked:translate-x-4 peer-checked:bg-primary-foreground" />
          </div>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Personal Details */}
            <FormSection title="Personal details" icon={User}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] text-muted-foreground mb-1.5">
                    First Name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-muted-foreground mb-1.5">
                    Last Name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-muted-foreground mb-1.5">
                    {t('patient.sex')}
                  </label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="field-input"
                  >
                    <option value="">Choose sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-muted-foreground mb-1.5">
                    {t('patient.birthday')}
                  </label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="field-input"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[13px] text-muted-foreground mb-1.5">
                    {t('patient.ethnicity')}
                  </label>
                  <select
                    value={ethnicity}
                    onChange={(e) => setEthnicity(e.target.value)}
                    className="field-input"
                  >
                    <option value="">Choose ethnicity</option>
                    <option value="caucasian">Caucasian</option>
                    <option value="asian">Asian</option>
                    <option value="african">African</option>
                    <option value="hispanic">Hispanic</option>
                    <option value="middle-eastern">Middle Eastern</option>
                    <option value="south-asian">South Asian</option>
                    <option value="indigenous">Indigenous</option>
                    <option value="mixed">Mixed</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </FormSection>

            {/* Contact Information */}
            <FormSection title={t('patient.contactInfo')} icon={Phone}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] text-muted-foreground mb-1.5">
                    {t('patient.email')}
                  </label>
                  <input
                    type="email"
                    placeholder="Enter e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-muted-foreground mb-1.5">
                    {t('patient.homePhone')}
                  </label>
                  <input
                    type="tel"
                    placeholder="(___) ___-____"
                    value={homePhone}
                    onChange={(e) => setHomePhone(e.target.value)}
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-muted-foreground mb-1.5">
                    {t('patient.cellPhone')}
                  </label>
                  <input
                    type="tel"
                    placeholder="(___) ___-____"
                    value={cellPhone}
                    onChange={(e) => setCellPhone(e.target.value)}
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-muted-foreground mb-1.5">
                    {t('patient.workPhone')}
                  </label>
                  <input
                    type="tel"
                    placeholder="(___) ___-____"
                    value={workPhone}
                    onChange={(e) => setWorkPhone(e.target.value)}
                    className="field-input"
                  />
                </div>
              </div>

              {!quickRegister && (
                <div className="mt-4 space-y-4 pt-4 border-t border-border/30">
                  <div>
                    <label className="block text-[13px] text-muted-foreground mb-1.5">
                      {t('patient.address')}
                    </label>
                    <input
                      type="text"
                      placeholder="Enter mailing address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="field-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] text-muted-foreground mb-1.5">
                        {t('patient.city')}
                      </label>
                      <input
                        type="text"
                        placeholder="Enter town or city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="field-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-muted-foreground mb-1.5">
                        {t('patient.postalCode')}
                      </label>
                      <input
                        type="text"
                        placeholder="Enter postal code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="field-input"
                      />
                    </div>
                  </div>
                </div>
              )}
            </FormSection>

            {/* About your visit */}
            {!quickRegister && (
              <FormSection title="About your visit" icon={MessageSquare}>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[13px] font-medium mb-3">How did you hear about us?</p>
                    <div className="space-y-1.5">
                      {REFERRAL_SOURCES.map((source) => (
                        <label
                          key={source}
                          className="flex items-center gap-2.5 text-[13px] cursor-pointer group/check rounded-md px-2 py-1 -mx-2 hover:bg-accent/30 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={referralSources.includes(source)}
                            onChange={() =>
                              setReferralSources(toggleArrayItem(referralSources, source))
                            }
                            className="accent-primary"
                          />
                          <span className="text-muted-foreground group-hover/check:text-foreground transition-colors">
                            {source}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium mb-3">What are you interested in?</p>
                    <div className="space-y-1.5">
                      {TREATMENT_INTERESTS.map((interest) => (
                        <label
                          key={interest}
                          className="flex items-center gap-2.5 text-[13px] cursor-pointer group/check rounded-md px-2 py-1 -mx-2 hover:bg-accent/30 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={treatmentInterests.includes(interest)}
                            onChange={() =>
                              setTreatmentInterests(toggleArrayItem(treatmentInterests, interest))
                            }
                            className="accent-primary"
                          />
                          <span className="text-muted-foreground group-hover/check:text-foreground transition-colors">
                            {interest}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </FormSection>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Medical Conditions */}
            <FormSection title="Medical conditions" icon={Heart}>
              <p className="text-[13px] text-muted-foreground mb-4">
                Do you have any of the following medical conditions?
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {MEDICAL_CONDITIONS.map((condition) => (
                  <label
                    key={condition}
                    className="flex items-center gap-2.5 text-[13px] cursor-pointer group/check rounded-md px-2 py-1 -mx-2 hover:bg-accent/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={medicalConditions.includes(condition)}
                      onChange={() =>
                        setMedicalConditions(toggleArrayItem(medicalConditions, condition))
                      }
                      className="accent-primary"
                    />
                    <span className="text-muted-foreground group-hover/check:text-foreground transition-colors">
                      {condition}
                    </span>
                  </label>
                ))}
              </div>
            </FormSection>

            {/* Medical History */}
            {!quickRegister && (
              <FormSection title="Medical history" icon={Stethoscope}>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-[13px] text-muted-foreground mb-1.5">
                      Family physician
                    </label>
                    <input
                      type="text"
                      placeholder="Physician's name"
                      value={familyPhysician}
                      onChange={(e) => setFamilyPhysician(e.target.value)}
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-muted-foreground mb-1.5">
                      Weight
                    </label>
                    <input
                      type="text"
                      placeholder="Weight"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-muted-foreground mb-1.5">
                      Height
                    </label>
                    <input
                      type="text"
                      placeholder="Height"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="field-input"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] text-muted-foreground mb-1.5">
                      Past illnesses or surgeries
                    </label>
                    <textarea
                      placeholder="Specify any past illnesses or surgeries"
                      rows={3}
                      value={pastIllnesses}
                      onChange={(e) => setPastIllnesses(e.target.value)}
                      className="field-input resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-muted-foreground mb-1.5">
                      Current medications
                    </label>
                    <textarea
                      placeholder="List current medications"
                      rows={3}
                      value={currentMedications}
                      onChange={(e) => setCurrentMedications(e.target.value)}
                      className="field-input resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-muted-foreground mb-1.5">
                      Conditions being treated
                    </label>
                    <textarea
                      placeholder="Specify conditions being treated"
                      rows={3}
                      value={conditionsBeingTreated}
                      onChange={(e) => setConditionsBeingTreated(e.target.value)}
                      className="field-input resize-none"
                    />
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/30">
                    <label className="flex items-start gap-2.5 text-[13px] cursor-pointer group/check rounded-md px-2 py-1.5 -mx-2 hover:bg-accent/30 transition-colors">
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-primary"
                        checked={previousSpecialistTreatment}
                        onChange={(e) => setPreviousSpecialistTreatment(e.target.checked)}
                      />
                      <span className="text-muted-foreground group-hover/check:text-foreground transition-colors">
                        Have you received treatment from an endocrinologist, dermatologist or
                        plastic surgeon?
                      </span>
                    </label>
                    <label className="flex items-start gap-2.5 text-[13px] cursor-pointer group/check rounded-md px-2 py-1.5 -mx-2 hover:bg-accent/30 transition-colors">
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-primary"
                        checked={pregnantOrBreastfeeding}
                        onChange={(e) => setPregnantOrBreastfeeding(e.target.checked)}
                      />
                      <span className="text-muted-foreground group-hover/check:text-foreground transition-colors">
                        Currently pregnant, breastfeeding, or planning pregnancy within the next
                        year?
                      </span>
                    </label>
                    <label className="flex items-start gap-2.5 text-[13px] cursor-pointer group/check rounded-md px-2 py-1.5 -mx-2 hover:bg-accent/30 transition-colors">
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-primary"
                        checked={smoker}
                        onChange={(e) => setSmoker(e.target.checked)}
                      />
                      <span className="text-muted-foreground group-hover/check:text-foreground transition-colors">
                        Do you smoke?
                      </span>
                    </label>
                  </div>
                </div>
              </FormSection>
            )}

            {/* Consent sections */}
            {!quickRegister && (
              <>
                <FormSection title="Botulinum Toxin Consent" icon={FileCheck}>
                  <p className="text-[13px] text-muted-foreground mb-3">
                    I have read and understood the consent form for botulinum toxin treatment.
                  </p>
                  <select
                    value={botulinumToxinConsent}
                    onChange={(e) => setBotulinumToxinConsent(e.target.value)}
                    className="field-input"
                  >
                    <option value="">Choose an option</option>
                    <option value="agree">I agree</option>
                    <option value="disagree">I disagree</option>
                  </select>
                </FormSection>

                <FormSection title="Photo Consent" icon={Camera}>
                  <p className="text-[13px] text-muted-foreground mb-3">
                    Do you consent to having your photographs used for educational purposes?
                  </p>
                  <select
                    value={photoConsent}
                    onChange={(e) => setPhotoConsent(e.target.value)}
                    className="field-input"
                  >
                    <option value="">Choose an option</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </FormSection>
              </>
            )}
          </div>
        </div>

        {/* Submit area */}
        <div className="glass-card rounded-xl p-5 flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">
            <span className="text-primary">*</span> Required fields must be filled
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving || !firstName.trim() || !lastName.trim()}
              className="btn-primary px-8 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="relative z-10">Registering...</span>
                </>
              ) : (
                <>
                  <ClipboardList className="h-4 w-4" />
                  <span className="relative z-10">Register Patient</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function FormSection({
  title,
  icon: Icon,
  children
}: {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <section className="glass-card rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border/30 flex items-center gap-2.5">
        {Icon && (
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}
