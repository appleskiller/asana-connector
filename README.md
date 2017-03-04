# asana-connector
Asana connector

# typings 
```
typings install express lodash --save
typings install dt~cookie-parser --save
typings install dt~node dt~asana --save --global
```

# 启动服务
```
$ npm run start
```

# 创建自己的CA机构 && 创建服务器端证书

* 为CA生成私钥
> openssl genrsa -out ca-key.pem -des 1024

* 通过CA私钥生成CSR
> openssl req -new -key ca-key.pem -out ca-csr.pem

* 通过CSR文件和私钥生成CA证书
> openssl x509 -req -in ca-csr.pem -signkey ca-key.pem -out ca-cert.pem

* 为服务器生成私钥
> openssl genrsa -out server-key.pem 1024

* 利用服务器私钥文件服务器生成CSR
> openssl req -new -key server-key.pem -config openssl.cnf -out server-csr.pem

这一步非常关键，你需要指定一份openssl.cnf文件。可以用这个

```
[req]  
    distinguished_name = req_distinguished_name  
    req_extensions = v3_req  
  
    [req_distinguished_name]  
    countryName = Country Name (2 letter code)  
    countryName_default = CN  
    stateOrProvinceName = State or Province Name (full name)  
    stateOrProvinceName_default = BeiJing  
    localityName = Locality Name (eg, city)  
    localityName_default = YaYunCun  
    organizationalUnitName  = Organizational Unit Name (eg, section)  
    organizationalUnitName_default  = Domain Control Validated  
    commonName = Internet Widgits Ltd  
    commonName_max  = 64  
  
    [ v3_req ]  
    # Extensions to add to a certificate request  
    basicConstraints = CA:FALSE  
    keyUsage = nonRepudiation, digitalSignature, keyEncipherment  
    subjectAltName = @alt_names  
  
    [alt_names]  
	#注意这个IP.1的设置，IP地址需要和你的服务器的监听地址一样
    IP.1 = 127.0.0.1
```
* 通过服务器私钥文件和CSR文件生成服务器证书
> openssl x509 -req -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -in server-csr.pem -out server-cert.pem -extensions v3_req -extfile openssl.cnf
* 请确保启动服务前已经将生成的server-cert.pem和server-key.pem拷贝到pem目录下。