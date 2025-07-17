
const res = await fetch('https://api.factus.com/ventas', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer TU_API_KEY',
      'Content-Type': 'application/json'
    },
    // body: JSON.stringify(body)
  });
  
  const data = await res.json();
  console.log(data);
  