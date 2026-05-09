const axios = require('axios');

const META_API_VERSION = process.env.META_API_VERSION || 'v18.0';
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;
const WA_BUSINESS_ACCOUNT_ID = process.env.WA_BUSINESS_ACCOUNT_ID;

const metaApi = axios.create({
  baseURL: `https://graph.facebook.com/${META_API_VERSION}`,
  headers: {
    Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

metaApi.interceptors.request.use((config) => {
  console.log(`[META API] ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

metaApi.interceptors.response.use(
  (response) => {
    console.log(`[META API] Response ${response.status}:`, JSON.stringify(response.data).slice(0, 200));
    return response;
  },
  (error) => {
    console.error(`[META API] Error:`, error.response?.data || error.message);
    throw error;
  }
);

const sendTemplateMessage = async (phone, templateName, language, components) => {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: components || []
      }
    };

    const response = await metaApi.post(`/${WA_PHONE_NUMBER_ID}/messages`, payload);
    return {
      success: true,
      messageId: response.data.messages?.[0]?.id || null,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      errorCode: error.response?.data?.error?.code || null
    };
  }
};

const getTemplates = async () => {
  try {
    const response = await metaApi.get(`/${WA_BUSINESS_ACCOUNT_ID}/message_templates`, {
      params: { limit: 100 }
    });
    return {
      success: true,
      templates: response.data.data || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

module.exports = {
  sendTemplateMessage,
  getTemplates
};
