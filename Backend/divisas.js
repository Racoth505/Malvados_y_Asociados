const POPULAR_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'CHF',
  'CNY',
  'AUD',
  'BRL',
  'ARS'
];

const fetchConversion = async (from, to, amount) => {
  const url = `${process.env.EXCHANGERATE_BASE_URL}/${process.env.EXCHANGERATE_API_KEY}/pair/${from}/${to}/${amount}`;
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const raw = await response.text();
    throw new Error(`Respuesta invalida de API externa: ${raw.slice(0, 120)}`);
  }

  return response.json();
};

const convertir = async (req, res, next) => {
  try {
    const { from = 'USD', to = 'MXN', amount = '1' } = req.query;
    const monto = Number(amount);

    if (!from || !to || Number.isNaN(monto) || monto <= 0) {
      return res.status(400).json({ error: 'Parametros invalidos' });
    }

    const data = await fetchConversion(from.toUpperCase(), to.toUpperCase(), monto);

    if (data.result !== 'success') {
      return res.status(400).json({ error: data['error-type'] || 'Error API externa' });
    }

    return res.json({
      from: data.base_code,
      to: data.target_code,
      rate: data.conversion_rate,
      amount: data.conversion_result
    });
  } catch (err) {
    next(err);
  }
};

const populares = async (req, res, next) => {
  try {
    const { to = 'MXN', amount = '1' } = req.query;
    const monto = Number(amount);

    if (!to || Number.isNaN(monto) || monto <= 0) {
      return res.status(400).json({ error: 'Parametros invalidos' });
    }

    const target = to.toUpperCase();

    const conversions = await Promise.all(
      POPULAR_CURRENCIES.map(async (currency) => {
        const data = await fetchConversion(currency, target, monto);

        if (data.result !== 'success') {
          throw new Error(data['error-type'] || `No se pudo convertir ${currency}`);
        }

        return {
          from: currency,
          to: data.target_code,
          rate: data.conversion_rate,
          amount: data.conversion_result
        };
      })
    );

    return res.json({
      to: target,
      amount: monto,
      monedas: conversions
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { convertir, populares };
