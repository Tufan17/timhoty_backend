import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_VERSION = "v22.0";

// Telefon numarasını WhatsApp API formatına çevir (+ işareti ve boşlukları temizle)
function formatPhoneNumber(phoneNumber: string): string {
  // + işareti, boşluklar ve tire karakterlerini temizle
  return phoneNumber.replace(/[\s\+\-\(\)]/g, "");
}

// Hata yönetimi fonksiyonu
function handleWhatsAppError(err: any, to: string) {
  const errorMessage = err.response?.data || err.message;
  console.error("WhatsApp mesaj gönderme hatası:", errorMessage);
  
  // Token hatası için daha açıklayıcı mesaj
  if (err.response?.data?.error?.code === 190) {
    const errorSubCode = err.response?.data?.error?.error_subcode;
    if (errorSubCode === 467) {
      throw new Error(
        "WhatsApp access token süresi dolmuş (user logged out). " +
        "Yeni bir permanent access token oluşturmanız gerekiyor. " +
        "Meta Business Suite > WhatsApp > API Setup bölümünden yeni token alın."
      );
    }
    throw new Error(
      "Invalid WhatsApp access token. Please check your WHATSAPP_TOKEN in .env file. " +
      "Token should be a valid permanent access token from Facebook Graph API."
    );
  }
  
  // Test modu hatası - numara izin listesinde değil
  if (err.response?.data?.error?.code === 131030) {
    throw new Error(
      `WhatsApp test modunda: Alıcı telefon numarası (${to}) izin verilenler listesinde değil. ` +
      "Meta Business Suite > WhatsApp > API Setup bölümünden numarayı test alıcıları listesine ekleyin. " +
      "Production modunda bu kısıtlama olmayacaktır."
    );
  }
  
  // Format mismatch hatası - template formatı uyuşmazlığı
  if (err.response?.data?.error?.code === 132012) {
    const errorDetails = err.response?.data?.error?.error_data?.details || "";
    throw new Error(
      `WhatsApp template format uyuşmazlığı: ${errorDetails}. ` +
      "Template'in header, body veya button component'leri için gerekli parametreler sağlanmamış. " +
      "sendWhatsAppTemplate() fonksiyonuna components parametresi ekleyin."
    );
  }
  
  throw err;
}

// Text mesaj gönderme
// NOT: Test modunda sadece template mesajlar gönderilebilir. Production modunda text mesajlar çalışır.
async function sendWhatsAppMessage(to: string, message: string): Promise<any> {
  console.log("WhatsApp mesajı gönderiliyor:", to);
  
  // Token kontrolü
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || process.env.PHONE_NUMBER_ID?.trim();
  
  if (!token) {
    throw new Error("WHATSAPP_TOKEN environment variable is not set or empty");
  }
  
  if (!phoneNumberId) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID or PHONE_NUMBER_ID environment variable is not set or empty");
  }

  // Telefon numarasını formatla
  const formattedPhoneNumber = formatPhoneNumber(to);
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedPhoneNumber,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("WhatsApp mesajı gönderildi:", response.data);
    return response.data;
  } catch (err: any) {
    // Test modunda text mesaj hatası - template mesaj öner
    if (err.response?.data?.error?.code === 131026) {
      throw new Error(
        "Test modunda serbest text mesajlar gönderilemez. Template mesaj kullanın: sendWhatsAppTemplate() fonksiyonunu kullanın veya hesabınızı production moduna geçirin."
      );
    }
    handleWhatsAppError(err, to);
  }
}

// Template mesaj gönderme
// components parametresi opsiyoneldir ve şu formatta olmalıdır:
// {
//   header?: Array<{ type: "image" | "video" | "document" | "text", image?: { link: string }, video?: { link: string }, document?: { link: string }, text?: string }>,
//   body?: Array<{ type: "text", text: string }>,
//   buttons?: Array<{ type: "url" | "quick_reply", url?: string, text?: string }>
// }
async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string = "en_US",
  components?: {
    header?: Array<{
      type: "image" | "video" | "document" | "text";
      image?: { link: string };
      video?: { link: string };
      document?: { link: string };
      text?: string;
    }>;
    body?: Array<{ type: "text"; text: string }>;
    buttons?: Array<{
      type: "url" | "quick_reply";
      url?: string;
      text?: string;
    }>;
  }
): Promise<any> {
  console.log("WhatsApp template mesajı gönderiliyor:", to, templateName);
  
  // Token kontrolü
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || process.env.PHONE_NUMBER_ID?.trim();
  
  if (!token) {
    throw new Error("WHATSAPP_TOKEN environment variable is not set or empty");
  }
  
  if (!phoneNumberId) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID or PHONE_NUMBER_ID environment variable is not set or empty");
  }

  // Telefon numarasını formatla
  const formattedPhoneNumber = formatPhoneNumber(to);
  
  // Template payload'ını oluştur
  const templatePayload: any = {
    name: templateName,
    language: {
      code: languageCode,
    },
  };

  // Components varsa ekle
  if (components) {
    const templateComponents: any[] = [];

    // Header component
    if (components.header && components.header.length > 0) {
      templateComponents.push({
        type: "header",
        parameters: components.header.map((header) => {
          if (header.type === "image" && header.image) {
            return {
              type: "image",
              image: header.image,
            };
          } else if (header.type === "video" && header.video) {
            return {
              type: "video",
              video: header.video,
            };
          } else if (header.type === "document" && header.document) {
            return {
              type: "document",
              document: header.document,
            };
          } else if (header.type === "text" && header.text) {
            return {
              type: "text",
              text: header.text,
            };
          }
          return null;
        }).filter(Boolean),
      });
    }

    // Body component
    if (components.body && components.body.length > 0) {
      templateComponents.push({
        type: "body",
        parameters: components.body.map((body) => ({
          type: "text",
          text: body.text,
        })),
      });
    }

    // Buttons component
    if (components.buttons && components.buttons.length > 0) {
      templateComponents.push({
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: components.buttons
          .filter((btn) => btn.type === "url" && btn.url)
          .map((btn) => ({
            type: "text",
            text: btn.url,
          })),
      });

      // Quick reply buttons
      const quickReplyButtons = components.buttons.filter(
        (btn) => btn.type === "quick_reply" && btn.text
      );
      if (quickReplyButtons.length > 0) {
        quickReplyButtons.forEach((btn, index) => {
          templateComponents.push({
            type: "button",
            sub_type: "quick_reply",
            index: index.toString(),
            parameters: [
              {
                type: "payload",
                payload: btn.text,
              },
            ],
          });
        });
      }
    }

    if (templateComponents.length > 0) {
      templatePayload.components = templateComponents;
    }
  }
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedPhoneNumber,
        type: "template",
        template: templatePayload,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("WhatsApp template mesajı gönderildi:", response.data);
    return response.data;
  } catch (err: any) {
    handleWhatsAppError(err, to);
  }
}

export { sendWhatsAppMessage, sendWhatsAppTemplate };
export default sendWhatsAppMessage;
