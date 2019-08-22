-- example HTTP POST script which demonstrates setting the
-- HTTP method, body, and adding a header

counter = 0

request = function()
    totalCounter = 100000000 + counter
   path = "/api/transactions"
   wrk.headers["Content-Type"] = "application/json"
   wrk.headers["Accept"] = "application/json"
   wrk.headers['version'] = "testnet"
   wrk.headers['port'] = 8001
   wrk.headers['nethash'] = "fl6ybowg"
   wrk.headers['os'] = ''

   body = '{"secret":"horse dinosaur brand october spoon news install tongue token pig napkin leg","amount":"%s","recipientId":"ECyhBC44N3VGop5ZkTViS5kT3AYoSwjkjo"}'
   wrk.body = string.format(body, totalCounter)

   counter = counter + 1
--    print(counter)
   return wrk.format("PUT", path)
end

-- function response(status, headers, body)
--     print(body)
-- end
