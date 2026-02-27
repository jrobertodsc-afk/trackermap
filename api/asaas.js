const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL = 'https://api.asaas.com/v3';

async function asaasRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
    },
  };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`${ASAAS_BASE_URL}${endpoint}`, options);
  return response.json();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  try {
    // ── CRIAR CLIENTE + ASSINATURA ──────────────────────────────────────────
    if (action === 'create-subscription' && req.method === 'POST') {
      const { name, email, cpfCnpj, phone, plan, mobilePhone, postalCode } = req.body;

      // Planos → valor + descrição
      const plans = {
        easy:    { value: 39.90, description: 'TrackerMap Easy' },
        premium: { value: 49.90, description: 'TrackerMap Premium' },
        smart:   { value: 59.90, description: 'TrackerMap Smart' },
        anual:   { value: 69.90, description: 'TrackerMap Anual' },
      };

      const selectedPlan = plans[plan?.toLowerCase()] || plans.easy;

      // 1. Cria ou busca cliente no Asaas
      let customer;
      const search = await asaasRequest('GET', `/customers?cpfCnpj=${cpfCnpj}`);
      if (search.data && search.data.length > 0) {
        customer = search.data[0];
      } else {
        customer = await asaasRequest('POST', '/customers', {
          name,
          email,
          cpfCnpj,
          phone,
          mobilePhone,
          postalCode,
          notificationDisabled: false,
        });
      }

      if (customer.errors) {
        return res.status(400).json({ error: 'Erro ao criar cliente no Asaas', details: customer.errors });
      }

      // 2. Cria assinatura recorrente mensal
      const today = new Date().toISOString().split('T')[0];
      const subscription = await asaasRequest('POST', '/subscriptions', {
        customer: customer.id,
        billingType: 'UNDEFINED', // cliente escolhe: boleto, pix ou cartão
        value: selectedPlan.value,
        nextDueDate: today,
        cycle: plan?.toLowerCase() === 'anual' ? 'YEARLY' : 'MONTHLY',
        description: selectedPlan.description,
        externalReference: cpfCnpj,
      });

      if (subscription.errors) {
        return res.status(400).json({ error: 'Erro ao criar assinatura', details: subscription.errors });
      }

      // 3. Busca o link de pagamento da primeira cobrança
      const charges = await asaasRequest('GET', `/subscriptions/${subscription.id}/payments`);
      const firstCharge = charges.data?.[0];

      return res.status(200).json({
        success: true,
        customer_id: customer.id,
        subscription_id: subscription.id,
        payment_link: firstCharge?.invoiceUrl || null,
        bank_slip_url: firstCharge?.bankSlipUrl || null,
        status: subscription.status,
      });
    }

    // ── LISTAR ASSINATURAS ──────────────────────────────────────────────────
    if (action === 'list-subscriptions' && req.method === 'GET') {
      const data = await asaasRequest('GET', '/subscriptions?limit=50');

      // Busca nome e CPF de cada cliente em paralelo
      if (data.data && data.data.length > 0) {
        await Promise.all(data.data.map(async (sub) => {
          try {
            const customer = await asaasRequest('GET', `/customers/${sub.customer}`);
            sub.customerName      = customer.name      || '—';
            sub.customerCpfCnpj   = customer.cpfCnpj   || '';
            sub.customerEmail     = customer.email      || '';
          } catch(e) {
            sub.customerName = sub.externalReference || '—';
          }
        }));
      }

      return res.status(200).json(data);
    }

    // ── STATUS DE UMA ASSINATURA ────────────────────────────────────────────
    if (action === 'subscription-status' && req.method === 'GET') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID da assinatura obrigatório' });
      const data = await asaasRequest('GET', `/subscriptions/${id}`);
      return res.status(200).json(data);
    }

    // ── CANCELAR ASSINATURA ─────────────────────────────────────────────────
    if (action === 'cancel-subscription' && req.method === 'POST') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID da assinatura obrigatório' });
      const data = await asaasRequest('DELETE', `/subscriptions/${id}`);
      return res.status(200).json({ success: true, data });
    }

    return res.status(400).json({ error: 'Ação inválida. Use: create-subscription, list-subscriptions, subscription-status, cancel-subscription' });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
