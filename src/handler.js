const pool = require('./db');

exports.handler = async (event) => {
  const cpf = event.queryStringParameters?.cpf;

  if (!cpf) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'CPF é obrigatório na query string' }),
    };
  }

  try {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [cpf]);

    if (rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Cliente não encontrado' }),
      };
    }

    const cliente = rows[0];

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Cliente autenticado com sucesso',
        cliente,
      }),
    };
  } catch (error) {
    console.error('Erro na Lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno da Lambda' }),
    };
  }
};
