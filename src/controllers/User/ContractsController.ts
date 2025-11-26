import { FastifyReply, FastifyRequest } from "fastify"

export default class UserController {

	async termsOfService(req: FastifyRequest, res: FastifyReply) {
		try {
			const htmlContent = `
                <html>
                    <head>
                        <title>Kullanıcı Sözleşmesi</title>
                    </head>
                    <body>
                        <h1>Kullanıcı Sözleşmesi</h1>
                        <p>Welcome to our service. By using our service, you agree to the following terms and conditions...</p>
                        <!-- Add more HTML content as needed -->
                    </body>
                </html>
            `
			return res.status(200).send({
				success: true,
				message: "User agreement generated successfully",
				data: htmlContent,
			})
		} catch (error) {
			console.log(error)
			res.status(500).send({
				success: false,
				message: "Error generating user agreement",
			})
		}
	}
	async userAgreement(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language
			let htmlContent = ""
			if (language === "tr") {
				htmlContent = `
                <!DOCTYPE html>
                <html lang="tr">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Kullanıcı Sözleşmesi</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                    </head>
                    <body class="bg-gray-50 py-8">
                        <div class="bg-white border-1 rounded-[24px] max-w-6xl mx-auto w-full h-full flex flex-col gap-6 py-[20px] px-4">
                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">1. AMAÇ VE KAPSAM</h3>
                                <p class="font-regular text-sm mb-4">Bu Kullanıcı Sözleşmesi ("Sözleşme"), GLOBIVOY TOURISM L.L.C ("Timhoty") tarafından işletilen platformun ("Platform") web sitesi, mobil uygulamaları ve diğer dijital servisleri üzerinden sunulan tüm hizmetleri kapsar.</p>
                                <p class="font-regular text-sm">Platforma erişen veya kullanan her kişi ("Kullanıcı"), bu Sözleşmeyi okuyup anladığını ve tüm şartları kabul ettiğini beyan eder.</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">2. TANIMLAR</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Platform: Timhoty'nin web sitesi, mobil uygulaması ve tüm dijital hizmetleri.</li>
                                    <li class="text-sm">Kullanıcı: Platformu kullanan gerçek kişi.</li>
                                    <li class="text-sm">Tedarikçi / İş Ortağı: Etkinlik, tur, bilet veya benzeri hizmetleri sunan üçüncü taraf.</li>
                                    <li class="text-sm">Etkinlik / Hizmet: Platform üzerinden sunulan tüm rezervasyon yapılabilir aktiviteler.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">3. SÖZLEŞMENİN KABULÜ VE GÜNCELLENMESİ</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Platformu kullanmak, bu şartların tamamının kabulü anlamına gelir.</li>
                                    <li class="text-sm">Timhoty, şartlarda değişiklik yapma hakkını saklı tutar.</li>
                                    <li class="text-sm">Güncellenen şartlar, yayımlandığı tarihten itibaren geçerlidir.</li>
                                    <li class="text-sm">Kullanıcı, değişikliklerden haberdar olmakla yükümlüdür.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">4. LİSANS VE KULLANIM HAKKI</h3>
                                <p class="font-regular text-sm mb-4">Timhoty, Kullanıcı'ya Platformu kişisel, ticari olmayan amaçlarla kullanma sınırlı, devredilemez bir lisans verir.</p>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Yazılımın kaynak kodunu çözemez, değiştiremez, satamaz, kopyalayamaz.</li>
                                    <li class="text-sm">Hizmeti kötüye kullanamaz, yasa dışı amaçlarla kullanamaz.</li>
                                    <li class="text-sm">Otomatik sistemler (bot, scraper vb.) kullanarak veri toplayamaz.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">5. KULLANICI HESABI</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Kullanıcı, 18 yaşını doldurmuş olmalıdır.</li>
                                    <li class="text-sm">Hesap oluştururken verilen bilgilerin doğru ve güncel tutulması gerekir.</li>
                                    <li class="text-sm">Şifre gizliliği tamamen Kullanıcı sorumluluğundadır.</li>
                                    <li class="text-sm">Hesap güvenliği ihlalinde support@timhoty.com adresine derhal bildirim yapılmalıdır.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">6. REZERVASYON VE ÖDEME ŞARTLARI</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Timhoty, Tedarikçiler adına aracı olarak hizmet verir.</li>
                                    <li class="text-sm">Platform üzerinden yapılan her rezervasyon, ilgili tedarikçinin onayına tabidir.</li>
                                    <li class="text-sm">Fiyatlar, hizmete özel olarak belirlenir ve para birimi Platform'da belirtilir.</li>
                                    <li class="text-sm">Ödemeler güvenli üçüncü taraf ödeme altyapısı üzerinden alınır.</li>
                                    <li class="text-sm">Timhoty, rezervasyon hatalarından veya ödeme servislerinin aksamasından sorumlu değildir.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">7. İPTAL VE İADE POLİTİKASI</h3>
                                <p class="font-regular text-sm mb-4">İade talepleri Timhoty tarafından vaka bazında değerlendirilir. Aşağıdaki durumlarda iade yapılmaz:</p>
                                <ul class="list-disc list-inside space-y-2 mb-4">
                                    <li class="text-sm">Kişisel nedenlerle etkinliğe katılamama</li>
                                    <li class="text-sm">Etkinliğin kaçırılması</li>
                                    <li class="text-sm">"En iyi fırsatlar" veya indirimli etkinlikler</li>
                                    <li class="text-sm">Üçüncü taraf satıcı kaynaklı kalite şikayetleri</li>
                                </ul>
                                <p class="font-regular text-sm mb-4">İptal süresi, aksi belirtilmedikçe etkinlikten en az 24 saat önce olmalıdır. Her hizmette iade politikası ayrı olabilir lütfen bakınız.</p>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Banka iadeleri: 10–15 iş günü</li>
                                    <li class="text-sm">Promosyon kodları: Nakit olarak iade edilmez</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">8. ETKİNLİKLER VE KATILIM SORUMLULUĞU</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Timhoty yalnızca aracı platformdur; etkinliklerin yürütülmesinden Tedarikçi sorumludur.</li>
                                    <li class="text-sm">Kullanıcı, etkinlik katılımında kendi güvenliğinden sorumludur.</li>
                                    <li class="text-sm">Etkinlik sırasında çekilen fotoğraf/video'lar Timhoty'nin sosyal medya kanallarında tanıtım amacıyla kullanılabilir. Kullanıcıdan izin alınmasına gerek yoktur.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">9. KULLANICI İÇERİĞİ VE PAYLAŞIM</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Kullanıcı tarafından yüklenen içerikler (yorum, fotoğraf, inceleme vb.) kullanıcının sorumluluğundadır.</li>
                                    <li class="text-sm">Kullanıcı, bu içerikleri Platformda yayınlama, çoğaltma ve tanıtımda kullanma hakkını Timhoty'ye devreder.</li>
                                    <li class="text-sm">Timhoty, uygunsuz veya yasalara aykırı içerikleri kaldırma hakkını saklı tutar.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">10. GİZLİLİK VE VERİ KORUMA</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Timhoty, kişisel verileri Kişisel Verilerin Korunması ve Çerez Tercihleri kapsamında işler.</li>
                                    <li class="text-sm">Kullanıcı, Platform'u kullanarak veri işleme koşullarını kabul etmiş sayılır.</li>
                                    <li class="text-sm">Timhoty, kullanıcı verilerini satmaz veya izinsiz üçüncü taraflarla paylaşmaz.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">11. GARANTİ VE SORUMLULUK REDDİ</h3>
                                <p class="font-regular text-sm mb-4">Timhoty hizmetleri "olduğu gibi" sunar. Platformun kesintisiz, hatasız veya belirli bir amaca uygun olacağı garanti edilmez.</p>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">veri kaybı</li>
                                    <li class="text-sm">gelir veya kâr kaybı</li>
                                    <li class="text-sm">üçüncü taraf aksaklıkları nedeniyle oluşan dolaylı zararlardan sorumlu tutulamaz.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">12. TAZMİNAT</h3>
                                <p class="font-regular text-sm">Kullanıcı, Platformu kullanırken yaptığı ihlaller sonucu Timhoty'nin uğrayabileceği her türlü zarar, dava, masraf veya talep karşısında Timhoty'yi tazmin etmeyi kabul eder.</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">13. FESİH</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Kullanıcı, hesabını dilediği an silebilir.</li>
                                    <li class="text-sm">Timhoty, şartların ihlali veya yasal gereklilik nedeniyle hesabı askıya alabilir ya da sonlandırabilir.</li>
                                    <li class="text-sm">Fesih durumunda, Kullanıcı Platforma erişimini kaybeder.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">14. ÜÇÜNCÜ TARAF LİNKLER VE ARAÇLAR</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Platform, üçüncü taraf bağlantılar veya servisler içerebilir.</li>
                                    <li class="text-sm">Bu bağlantılar bilgilendirme amaçlıdır; içeriklerinden Timhoty sorumlu değildir.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">15. HUKUKİ DAYANAK VE YETKİ</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Bu Sözleşme, Birleşik Arap Emirlikleri – Dubai Yasalarına tabidir.</li>
                                    <li class="text-sm">Taraflar arasında doğabilecek uyuşmazlıklar, Dubai Mahkemeleri'nin yetkisindedir.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">16. BÖLÜNEBİLİRLİK VE TAM SÖZLEŞME</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Herhangi bir madde geçersiz sayılırsa, diğer hükümler yürürlükte kalır.</li>
                                    <li class="text-sm">Bu Sözleşme ve Gizlilik Politikası, taraflar arasındaki tek ve tam anlaşmayı oluşturur.</li>
                                </ul>
                            </div>

                            <div class="mt-6 pt-4 border-t border-gray-200">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">17. İLETİŞİM</h3>
                                <p class="font-regular text-sm mb-2">Her türlü soru, öneri veya yasal bildirim için:</p>
                                <div class="space-y-1 text-sm">
                                    <div class="font-semibold text-[#1173DB]">support@timhoty.com</div>
                                    <div class="font-semibold text-[#1173DB]">Web: https://www.timhoty.com</div>
                                </div>
                            </div>
                        </div>
                    </body>
                </html>
            `
			} else if (language === "en") {
				htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>User Agreement</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                    </head>
                    <body class="bg-gray-50 py-8">
                        <div class="bg-white border-1 rounded-[24px] max-w-6xl mx-auto w-full h-full flex flex-col gap-6 py-[20px] px-4">
                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">1. PURPOSE AND SCOPE</h3>
                                <p class="font-regular text-sm mb-4">This User Agreement ("Agreement") covers all services provided through the website, mobile applications, and other digital services of the platform ("Platform") operated by GLOBIVOY TOURISM L.L.C ("Timhoty").</p>
                                <p class="font-regular text-sm">Anyone who accesses or uses the Platform ("User") declares that they have read and understood this Agreement and accept all its terms.</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">2. DEFINITIONS</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Platform: Timhoty's website, mobile application, and all digital services.</li>
                                    <li class="text-sm">User: A natural person who uses the Platform.</li>
                                    <li class="text-sm">Supplier / Business Partner: A third party that provides activities, tours, tickets, or similar services.</li>
                                    <li class="text-sm">Activity / Service: All bookable activities offered through the Platform.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">3. ACCEPTANCE AND UPDATES OF THE AGREEMENT</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Using the Platform means acceptance of all these terms.</li>
                                    <li class="text-sm">Timhoty reserves the right to modify the terms.</li>
                                    <li class="text-sm">Updated terms become effective from the date of publication.</li>
                                    <li class="text-sm">Users are obliged to stay informed about changes.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">4. LICENSE AND USE RIGHTS</h3>
                                <p class="font-regular text-sm mb-4">Timhoty grants the User a limited, non-transferable license to use the Platform for personal, non-commercial purposes.</p>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">You may not reverse engineer, modify, sell, or copy the source code of the software.</li>
                                    <li class="text-sm">You may not misuse the service or use it for illegal purposes.</li>
                                    <li class="text-sm">You may not collect data using automated systems (bots, scrapers, etc.).</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">5. USER ACCOUNT</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Users must be at least 18 years old.</li>
                                    <li class="text-sm">Information provided when creating an account must be accurate and kept up to date.</li>
                                    <li class="text-sm">Password confidentiality is entirely the User's responsibility.</li>
                                    <li class="text-sm">In case of account security breach, notification must be made immediately to support@timhoty.com</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">6. RESERVATION AND PAYMENT TERMS</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Timhoty acts as an intermediary on behalf of Suppliers.</li>
                                    <li class="text-sm">Every reservation made through the Platform is subject to the approval of the relevant supplier.</li>
                                    <li class="text-sm">Prices are determined specifically for each service and the currency is indicated on the Platform.</li>
                                    <li class="text-sm">Payments are processed through secure third-party payment infrastructure.</li>
                                    <li class="text-sm">Timhoty is not responsible for reservation errors or disruptions in payment services.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">7. CANCELLATION AND REFUND POLICY</h3>
                                <p class="font-regular text-sm mb-4">Refund requests are evaluated by Timhoty on a case-by-case basis. Refunds will not be made in the following cases:</p>
                                <ul class="list-disc list-inside space-y-2 mb-4">
                                    <li class="text-sm">Failure to attend the activity due to personal reasons</li>
                                    <li class="text-sm">Missing the activity</li>
                                    <li class="text-sm">"Best deals" or discounted activities</li>
                                    <li class="text-sm">Quality complaints originating from third-party vendors</li>
                                </ul>
                                <p class="font-regular text-sm mb-4">Cancellation must be made at least 24 hours before the activity, unless otherwise stated. Refund policies may vary for each service, please review.</p>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Bank refunds: 10–15 business days</li>
                                    <li class="text-sm">Promotion codes: Not refunded in cash</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">8. ACTIVITIES AND PARTICIPATION RESPONSIBILITY</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Timhoty is only an intermediary platform; the Supplier is responsible for the execution of activities.</li>
                                    <li class="text-sm">Users are responsible for their own safety during activity participation.</li>
                                    <li class="text-sm">Photos/videos taken during activities may be used for promotional purposes on Timhoty's social media channels. No permission from the user is required.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">9. USER CONTENT AND SHARING</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Content uploaded by users (comments, photos, reviews, etc.) is the user's responsibility.</li>
                                    <li class="text-sm">Users grant Timhoty the right to publish, reproduce, and use this content for promotional purposes on the Platform.</li>
                                    <li class="text-sm">Timhoty reserves the right to remove inappropriate or illegal content.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">10. PRIVACY AND DATA PROTECTION</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Timhoty processes personal data in accordance with Data Protection and Cookie Preferences.</li>
                                    <li class="text-sm">By using the Platform, users are deemed to have accepted the data processing conditions.</li>
                                    <li class="text-sm">Timhoty does not sell user data or share it with unauthorized third parties.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">11. WARRANTY AND LIABILITY DISCLAIMER</h3>
                                <p class="font-regular text-sm mb-4">Timhoty provides services "as is". The Platform is not guaranteed to be uninterrupted, error-free, or suitable for any particular purpose.</p>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">data loss</li>
                                    <li class="text-sm">loss of income or profit</li>
                                    <li class="text-sm">Timhoty cannot be held liable for indirect damages arising from third-party disruptions.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">12. INDEMNIFICATION</h3>
                                <p class="font-regular text-sm">Users agree to indemnify Timhoty against any damage, lawsuit, expense, or claim that Timhoty may suffer as a result of violations committed while using the Platform.</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">13. TERMINATION</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Users may delete their account at any time.</li>
                                    <li class="text-sm">Timhoty may suspend or terminate accounts due to violation of terms or legal requirements.</li>
                                    <li class="text-sm">Upon termination, Users lose access to the Platform.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">14. THIRD-PARTY LINKS AND TOOLS</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">The Platform may contain third-party links or services.</li>
                                    <li class="text-sm">These links are for informational purposes; Timhoty is not responsible for their content.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">15. LEGAL BASIS AND JURISDICTION</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">This Agreement is subject to the laws of the United Arab Emirates – Dubai.</li>
                                    <li class="text-sm">Disputes that may arise between the parties are under the jurisdiction of Dubai Courts.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">16. SEVERABILITY AND COMPLETE AGREEMENT</h3>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">If any provision is deemed invalid, the other provisions remain in effect.</li>
                                    <li class="text-sm">This Agreement and the Privacy Policy constitute the sole and complete agreement between the parties.</li>
                                </ul>
                            </div>

                            <div class="mt-6 pt-4 border-t border-gray-200">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">17. CONTACT</h3>
                                <p class="font-regular text-sm mb-2">For any questions, suggestions, or legal notices:</p>
                                <div class="space-y-1 text-sm">
                                    <div class="font-semibold text-[#1173DB]">support@timhoty.com</div>
                                    <div class="font-semibold text-[#1173DB]">Web: https://www.timhoty.com</div>
                                </div>
                            </div>
                        </div>
                    </body>
                </html>
            `
			}

			return res.status(200).send({
				success: true,
				message: "User agreement generated successfully",
				data: htmlContent,
			})
		} catch (error) {
			console.log(error)
			res.status(500).send({
				success: false,
				message: "Error generating user agreement",
			})
		}
	}

	async cookiePolicy(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language
			let htmlContent = ""
            if (language === "tr") {
                htmlContent = `
                <!DOCTYPE html>
                <html lang="tr">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Çerez Tercihleri</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                    </head>
                    <body class="bg-gray-50 py-8">
                        <div class="bg-white border-1 rounded-[24px] max-w-6xl mx-auto w-full h-full flex flex-col gap-6 py-[20px] px-4">
                            <div class="font-regular text-sm space-y-4">
                                <p>Bu bölüm, web sitemiz ve Timhoty uygulamalarında kullanılan çerezleri, izleme dışı anonim analitikleri ve diğer sistemleri etkinleştirmeniz veya devre dışı bırakmanız açısından bilgi sağlar.</p>
                                <p>Farklı teknoloji grupları arasında gezinerek her bir grup hakkında ayrıntılı bilgi edinebilir ve verilerinizin nasıl işlendiğine dair net bilgilere ulaşabilirsiniz.</p>
                                <p>Tercihleriniz tüm cihazlar ve platformlar genelinde hatırlanır. Tercihlerinizi dilediğiniz zaman web sitemizde veya mobil uygulamadaki "Hesabım" bölümünden güncelleyebilirsiniz.</p>
                            </div>
            
                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">Kesinlikle Gerekli Teknolojiler</h3>
                                <p class="font-regular text-sm mb-4">Bu teknolojiler platformlarımızın temel işlevleri için zorunludur.</p>
                                <ul class="list-disc list-inside space-y-2 mb-4">
                                    <li class="text-sm">Hesap oluşturma, oturum açma</li>
                                    <li class="text-sm">Gizlilik izinlerinin kaydedilmesi</li>
                                    <li class="text-sm">Rezervasyon işlemlerinin yönetimi</li>
                                    <li class="text-sm">Dil, para birimi ve tercihlerin hatırlanması</li>
                                    <li class="text-sm">Güvenlik, erişilebilirlik ve bot koruması</li>
                                </ul>
                                <p class="font-semibold text-sm text-gray-700">Bu teknolojiler olmadan platformlarımız doğru şekilde çalışmaz.</p>
                            </div>
            
                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">Pazarlama Teknolojileri</h3>
                                <p class="font-regular text-sm mb-4">
                                    Timhoty yalnızca kullanıcı deneyimini geliştirmek amacıyla sınırlı pazarlama teknolojileri kullanır.
                                    Bu teknolojiler kişisel veri takibi, reklam amaçlı profilleme veya herhangi bir üçüncü tarafla veri paylaşımı için kullanılmaz.
                                </p>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Gösterilen içeriklerin genel etkileşimi anonim olarak ölçülebilir.</li>
                                    <li class="text-sm">Herhangi bir kişisel veri üçüncü taraflarla paylaşılmaz.</li>
                                    <li class="text-sm">Cihazlar arası eşleştirme, reklam takibi veya kişiselleştirilmiş reklam gösterimi yapılmaz.</li>
                                    <li class="text-sm">Tüm veriler yalnızca anonim toplu istatistiklerde değerlendirilir.</li>
                                </ul>
                            </div>
            
                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">Analitik Teknolojiler</h3>
                                <p class="font-regular text-sm mb-4">
                                    Bu teknolojiler, platformlarımızın performansını anlamamıza ve geliştirmemize yardımcı olur.
                                    Analitik veriler anonimdir; kullanıcı takibi, profilleme veya reklam amaçlı kullanılmaz.
                                </p>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Uygulama performansı, hız ve hata oranları anonim olarak ölçülür.</li>
                                    <li class="text-sm">En sık kullanılan özellikler belirlenir.</li>
                                    <li class="text-sm">Kullanıcı deneyimini iyileştirmek için iç analiz yapılır.</li>
                                    <li class="text-sm">Kişisel veriler üçüncü taraflara aktarılmaz.</li>
                                </ul>
                            </div>
            
                            <div class="mt-6 pt-4 border-t border-gray-200">
                                <p class="font-regular text-sm mb-2">Timhoty, bu bilgileri zaman zaman güncelleyebilir.</p>
                                <p class="font-regular text-sm text-gray-600">YGK: Yönetilebilir Gizlilik Konsolu</p>
                            </div>
            
                            <div class="mt-6 pt-4 border-t border-gray-200">
                                <div class="font-semibold text-sm text-[#1173DB] mb-2">GLOBIVOY TOURISM L.L.C</div>
                                <div class="space-y-1 text-sm">
                                    <div>Adres: Warba Centre 5. Kat No:504 Al Murqabat/Deira Dubai/BAE</div>
                                    <div>Ticaret Lisans No: 1235153</div>
                                    <div>Mail: support@timhoty.com</div>
                                </div>
                            </div>
                        </div>
                    </body>
                </html>
                `
            } else if (language === "en") {
                htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Cookie Preferences</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                    </head>
                    <body class="bg-gray-50 py-8">
                        <div class="bg-white border-1 rounded-[24px] max-w-6xl mx-auto w-full h-full flex flex-col gap-6 py-[20px] px-4">
            
                            <div class="font-regular text-sm space-y-4">
                                <p>This section provides information about enabling or disabling cookies, non-tracking anonymous analytics, and other systems used on our website and Timhoty applications.</p>
                                <p>You can explore different technology groups and learn how your data is processed in a transparent way.</p>
                                <p>Your preferences are remembered across devices and platforms. You can update them anytime through the “My Account” section.</p>
                            </div>
            
                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">Strictly Necessary Technologies</h3>
                                <p class="font-regular text-sm mb-4">These technologies are essential for the core functions of our platforms.</p>
                                <ul class="list-disc list-inside space-y-2 mb-4">
                                    <li class="text-sm">Account creation and login</li>
                                    <li class="text-sm">Saving privacy permissions</li>
                                    <li class="text-sm">Managing reservation processes</li>
                                    <li class="text-sm">Remembering language, currency and preferences</li>
                                    <li class="text-sm">Security, accessibility and bot protection</li>
                                </ul>
                                <p class="font-semibold text-sm text-gray-700">Our platforms cannot function properly without these technologies.</p>
                            </div>
            
                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">Marketing Technologies</h3>
                                <p class="font-regular text-sm mb-4">
                                    Timhoty uses limited marketing technologies only to improve user experience.
                                    These technologies are not used for personal data tracking, advertising profiling, or sharing any information with third parties.
                                </p>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">General engagement with displayed content may be measured anonymously.</li>
                                    <li class="text-sm">No personal data is shared with any third-party companies.</li>
                                    <li class="text-sm">No device linking, advertising tracking, or personalized ads are performed.</li>
                                    <li class="text-sm">All data is evaluated only as anonymous aggregated statistics.</li>
                                </ul>
                            </div>
            
                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">Analytics Technologies</h3>
                                <p class="font-regular text-sm mb-4">
                                    Analytics technologies help us understand how our platforms perform. 
                                    These analytics are anonymous and are not used for tracking, profiling or advertising.
                                </p>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">App speed, performance and error rates are measured anonymously.</li>
                                    <li class="text-sm">Frequently used features are identified.</li>
                                    <li class="text-sm">User experience improvements are made based on anonymous insights.</li>
                                    <li class="text-sm">No personal data is shared with third-party services.</li>
                                </ul>
                            </div>
            
                            <div class="mt-6 pt-4 border-t border-gray-200">
                                <p class="font-regular text-sm mb-2">Timhoty may update this information at any time.</p>
                                <p class="font-regular text-sm text-gray-600">MPC: Manageable Privacy Console</p>
                            </div>
            
                            <div class="mt-6 pt-4 border-t border-gray-200">
                                <div class="font-semibold text-sm text-[#1173DB] mb-2">GLOBIVOY TOURISM L.L.C</div>
                                <div class="space-y-1 text-sm">
                                    <div>Address: Warba Centre 5th Floor No:504 Al Murqabat/Deira Dubai/UAE</div>
                                    <div>Trade License No: 1235153</div>
                                    <div>Email: support@timhoty.com</div>
                                </div>
                            </div>
                        </div>
                    </body>
                </html>
                `
            }
            

			return res.status(200).send({
				success: true,
				message: "Privacy policy generated successfully",
				data: htmlContent,
			})
		} catch (error) {
			console.log(error)
			res.status(500).send({
				success: false,
				message: "Error generating privacy policy",
			})
		}
	}
	async privacyPolicy(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language
			let htmlContent = ""
			if (language === "tr") {
				htmlContent = `
                <!DOCTYPE html>
                <html lang="tr">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Kişisel Verilerin Korunması</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                    </head>
                    <body class="bg-gray-50 py-8">
                        <div class="bg-white border-1 rounded-[24px] max-w-6xl mx-auto w-full h-full flex flex-col gap-6 py-[20px] px-4">
                            <div class="font-regular text-sm space-y-4">
                                <p>Timhoty, GlobiVoy Tourism L.L.C. kuruluşu olup ("GlobiVoy", "Şirket", "biz"), kullanıcılarının gizliliğini ve kişisel verilerinin korunmasını önemsemektedir. İşbu Gizlilik ve Kişisel Verilerin Korunması Politikası ("Politika"), Birleşik Arap Emirlikleri Federal Kişisel Verilerin Korunması Kanunu (Federal Decree Law No. 45 of 2021) ve ilgili mevzuata uygun olarak hazırlanmıştır.</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">1. Veri Sorumlusu</h3>
                                <p class="font-regular text-sm">Kişisel verileriniz, veri sorumlusu sıfatıyla GlobiVoy Tourism L.L.C. tarafından işlenmektedir. Timhoty, GlobiVoy Tourism L.L.C. tarafından işletilen bir marka ve platformdur.</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">2. Toplanan Kişisel Veriler</h3>
                                <p class="font-regular text-sm mb-4">Timhoty platformu üzerinden aşağıdaki kişisel veriler toplanabilmektedir:</p>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Kimlik Bilgileri: Ad, Soyad, doğum tarihi, pasaport bilgileri (zorunlu hallerde).</li>
                                    <li class="text-sm">İletişim Bilgileri: Telefon numarası, e-posta adresi, ikamet adresi.</li>
                                    <li class="text-sm">Finansal Bilgiler: Ödeme bilgileri (kredi kartı verileri yalnızca ödeme altyapısı tarafından işlenir, GlobiVoy/Timhoty sistemlerinde saklanmaz).</li>
                                    <li class="text-sm">Rezervasyon ve Seyahat Bilgileri: Tur paketleri, uçuş/otel rezervasyonları, seyahat tercihleri.</li>
                                    <li class="text-sm">Teknik Veriler: IP adresi, cihaz modeli, konum bilgisi, çerez ve kullanım verileri.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">3. İşleme Amaçları</h3>
                                <p class="font-regular text-sm mb-4">Kişisel verileriniz şu amaçlarla işlenmektedir:</p>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Timhoty uygulaması ve web sitesi üzerinden turizm hizmetlerinin sunulması</li>
                                    <li class="text-sm">Rezervasyon, ödeme ve faturalama süreçlerinin yürütülmesi</li>
                                    <li class="text-sm">Müşteri hizmetleri ve destek sağlanması</li>
                                    <li class="text-sm">Kullanıcı deneyiminin geliştirilmesi, kampanyalar ve kişiselleştirilmiş içerik sunulması</li>
                                    <li class="text-sm">Yasal yükümlülüklerin yerine getirilmesi (ör. göçmenlik otoritelerine zorunlu raporlamalar)</li>
                                    <li class="text-sm">Güvenlik, sahtecilik ve dolandırıcılığın önlenmesi</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">4. Verilerin Paylaşımı</h3>
                                <p class="font-regular text-sm mb-4">Kişisel verileriniz yalnızca hizmetin sağlanması veya yasal zorunluluk durumlarında paylaşılabilir:</p>
                                <ul class="list-disc list-inside space-y-2 mb-4">
                                    <li class="text-sm">Turizm hizmet sağlayıcıları (oteller, havayolları, transfer firmaları, tur operatörleri)</li>
                                    <li class="text-sm">Ödeme altyapısı sağlayıcıları ve bankalar</li>
                                    <li class="text-sm">BAE'deki ve uluslararası yetkili kamu otoriteleri</li>
                                    <li class="text-sm">Sözleşmeli iş ortaklarımız ve teknik hizmet sağlayıcılarımız</li>
                                </ul>
                                <p class="font-semibold text-sm text-gray-700">Verileriniz hiçbir şekilde üçüncü taraflara satılmaz.</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">5. Verilerin Yurtdışına Aktarımı</h3>
                                <p class="font-regular text-sm">Hizmetin gerektirdiği durumlarda (örneğin yurtdışı otel rezervasyonu), verileriniz yalnızca yasal güvenceler sağlanarak BAE dışındaki ülkelere aktarılır.</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">6. Saklama Süresi</h3>
                                <p class="font-regular text-sm mb-4">Kişisel verileriniz:</p>
                                <ul class="list-disc list-inside space-y-2 mb-4">
                                    <li class="text-sm">Yasal yükümlülüklerin gerektirdiği süre boyunca,</li>
                                    <li class="text-sm">Ticari ilişki süresince saklanır.</li>
                                </ul>
                                <p class="font-semibold text-sm text-gray-700">Süre dolduğunda güvenli şekilde silinir veya anonim hale getirilir.</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">7. Kullanıcı Hakları</h3>
                                <p class="font-regular text-sm mb-4">BAE Federal Kişisel Verilerin Korunması Kanunu uyarınca aşağıdaki haklara sahipsiniz:</p>
                                <ul class="list-disc list-inside space-y-2 mb-4">
                                    <li class="text-sm">Kişisel verilerinize erişim talep etme</li>
                                    <li class="text-sm">Yanlış veya eksik bilgilerin düzeltilmesini isteme</li>
                                    <li class="text-sm">Verilerinizin silinmesini talep etme</li>
                                    <li class="text-sm">Belirli bir işlemeye itiraz etme veya kısıtlama talep etme</li>
                                    <li class="text-sm">Verilerinizin başka bir hizmet sağlayıcıya aktarılmasını isteme (data portability)</li>
                                    <li class="text-sm">Daha önce vermiş olduğunuz rızayı geri çekme</li>
                                </ul>
                                <p class="font-semibold text-sm text-[#1173DB]">Talepleriniz için: support@timhoty.com</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">8. Güvenlik</h3>
                                <p class="font-regular text-sm">GlobiVoy/Timhoty, kişisel verilerinizi korumak için uygun teknik ve idari tedbirleri uygular.</p>
                            </div>

                            <div class="mt-6 pt-4 border-t border-gray-200">
                                <div class="font-semibold text-sm text-[#1173DB] mb-2">GLOBIVOY TOURISM L.L.C</div>
                                <div class="space-y-1 text-sm">
                                    <div>Adres: Warba Centre 5. Kat No:504 Al Murqabat/Deira Dubai/BAE</div>
                                    <div>Ticaret Lisans No: 1235153</div>
                                    <div>Mail: support@timhoty.com</div>
                                </div>
                            </div>
                        </div>
                    </body>
                </html>
            `
			} else if (language === "en") {
				htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Data Protection</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                </head>
                    <body class="bg-gray-50 py-8">
                        <div class="bg-white border-1 rounded-[24px] max-w-6xl mx-auto w-full h-full flex flex-col gap-6 py-[20px] px-4">
                            <div class="font-regular text-sm space-y-4">
                                <p>Timhoty, being GlobiVoy Tourism L.L.C. ("GlobiVoy", "Company", "we"), values the privacy and protection of personal data of its users. This Privacy and Personal Data Protection Policy ("Policy") has been prepared in accordance with the United Arab Emirates Federal Personal Data Protection Law (Federal Decree Law No. 45 of 2021) and related legislation.</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">1. Data Controller</h3>
                                <p class="font-regular text-sm">Your personal data is processed by GlobiVoy Tourism L.L.C. as the data controller. Timhoty is a brand and platform operated by GlobiVoy Tourism L.L.C.</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">2. Personal Data Collected</h3>
                                <p class="font-regular text-sm mb-4">The following personal data may be collected through the Timhoty platform:</p>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Identity Information: Name, Surname, date of birth, passport information (when required).</li>
                                    <li class="text-sm">Contact Information: Phone number, email address, residential address.</li>
                                    <li class="text-sm">Financial Information: Payment information (credit card data is processed only by the payment infrastructure and is not stored in GlobiVoy/Timhoty systems).</li>
                                    <li class="text-sm">Reservation and Travel Information: Tour packages, flight/hotel reservations, travel preferences.</li>
                                    <li class="text-sm">Technical Data: IP address, device model, location information, cookies and usage data.</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">3. Processing Purposes</h3>
                                <p class="font-regular text-sm mb-4">Your personal data is processed for the following purposes:</p>
                                <ul class="list-disc list-inside space-y-2">
                                    <li class="text-sm">Providing tourism services through the Timhoty application and website</li>
                                    <li class="text-sm">Executing reservation, payment, and billing processes</li>
                                    <li class="text-sm">Providing customer services and support</li>
                                    <li class="text-sm">Improving user experience, campaigns, and providing personalized content</li>
                                    <li class="text-sm">Fulfilling legal obligations (e.g., mandatory reporting to immigration authorities)</li>
                                    <li class="text-sm">Security, prevention of fraud and forgery</li>
                                </ul>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">4. Data Sharing</h3>
                                <p class="font-regular text-sm mb-4">Your personal data may only be shared for service provision or legal requirement situations:</p>
                                <ul class="list-disc list-inside space-y-2 mb-4">
                                    <li class="text-sm">Tourism service providers (hotels, airlines, transfer companies, tour operators)</li>
                                    <li class="text-sm">Payment infrastructure providers and banks</li>
                                    <li class="text-sm">Authorized public authorities in the UAE and internationally</li>
                                    <li class="text-sm">Our contractual business partners and technical service providers</li>
                                </ul>
                                <p class="font-semibold text-sm text-gray-700">Your data is never sold to third parties.</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">5. Transfer of Data Abroad</h3>
                                <p class="font-regular text-sm">In cases required by the service (e.g., international hotel reservation), your data is transferred to countries outside the UAE only with legal safeguards in place.</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">6. Retention Period</h3>
                                <p class="font-regular text-sm mb-4">Your personal data:</p>
                                <ul class="list-disc list-inside space-y-2 mb-4">
                                    <li class="text-sm">is retained for the period required by legal obligations,</li>
                                    <li class="text-sm">is retained during the commercial relationship.</li>
                                </ul>
                                <p class="font-semibold text-sm text-gray-700">Upon expiration of the period, it is securely deleted or anonymized.</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">7. User Rights</h3>
                                <p class="font-regular text-sm mb-4">In accordance with the UAE Federal Personal Data Protection Law, you have the following rights:</p>
                                <ul class="list-disc list-inside space-y-2 mb-4">
                                    <li class="text-sm">Request access to your personal data</li>
                                    <li class="text-sm">Request correction of incorrect or incomplete information</li>
                                    <li class="text-sm">Request deletion of your data</li>
                                    <li class="text-sm">Object to or request restriction of specific processing</li>
                                    <li class="text-sm">Request transfer of your data to another service provider (data portability)</li>
                                    <li class="text-sm">Withdraw previously given consent</li>
                                </ul>
                                <p class="font-semibold text-sm text-[#1173DB]">For your requests: support@timhoty.com</p>
                            </div>

                            <div class="mt-6">
                                <h3 class="font-semibold text-lg text-[#FF6B00] mb-3">8. Security</h3>
                                <p class="font-regular text-sm">GlobiVoy/Timhoty implements appropriate technical and administrative measures to protect your personal data.</p>
                            </div>

                            <div class="mt-6 pt-4 border-t border-gray-200">
                                <div class="font-semibold text-sm text-[#1173DB] mb-2">GLOBIVOY TOURISM L.L.C</div>
                                <div class="space-y-1 text-sm">
                                    <div>Address: Warba Centre 5th Floor No:504 Al Murqabat/Deira Dubai/UAE</div>
                                    <div>Trade License No: 1235153</div>
                                    <div>Email: support@timhoty.com</div>
                                </div>
                            </div>
                        </div>
                </body>
            </html>
        `
			}
			return res.status(200).send({
				success: true,
				message: "Privacy policy generated successfully",
				data: htmlContent,
			})
		} catch (error) {
			console.log(error)
			res.status(500).send({
				success: false,
				message: "Error generating privacy policy",
			})
		}
	}
}

