var mongodb = require('./db');
var crypto = require('crypto');

function User(user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email || '';
};

// 存储用户信息
User.prototype.save = function(callback) {
	var md5 = crypto.createHash('md5'),
		email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
		head = 'http://www.gravatar.com/avatar/' + email_MD5 + '?s=48';
	// 要存入数据库的用户文档
	var user = {
		name: this.name,
		password: this.password,
		email: this.email,
		head: head
	};
	// 打开数据库
	mongodb.open(function(err, db) {
		if(err){
			// 错误，返回err信息
			return callback(err);
		};
		//读取users集合
		db.collection('users', function(err, collection) {
			if(err){
				mongodb.close();
				return callback(err);
			}
			// 将用户数据插入users集合
			collection.insert(user, {
				safe: true
			}, function(err, user) {
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, user[0]);
			});
		});
	});
};

User.update = function (name, nickname, sex, age, phone, province, city, district, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('users', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// 更新用户内容
			collection.update({
				name: name
			}, {
				$set: {
					nickname: nickname,
					sex: sex,
					age: age,
					phone: phone,
					province: province,
					city: city,
					district: district
				}
			}, function(err, user) {
				if(err){
					return callback(err);
				}
				// 查找用户名(name键)的值为name一个文档
				collection.findOne({
					name: name
				}, function(err, user){
					mongodb.close();
					if(err){
						return callback(err);
					}
					callback(null, user);
				})
			});
		});
	});
}

User.updatePwd = function (name, password, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('users', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// 更新用户内容
			collection.update({
				name: name
			}, {
				$set: {
					password: password
				}
			}, function(err, user){
				mongodb.close();
				// 这里会无缘无故的报错。
				// { [MongoError: server localhost:27017 sockets closed]
  				// name: 'MongoError',
  				// message: 'server localhost:27017 sockets closed' }
				if(err){
					console.log(err);
					// 针对name=='MongoError'的错误不做任何处理。
					if (!err.name == 'MongoError') {
						return callback(err);
					}
				}
				callback(null, user);
			})
		});
	});
}

// 读取用户信息
User.get = function(name, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if(err){
			return callback(err);
		}
		//读取Users集合
		db.collection('users', function(err, collection) {
			if(err){
				mongodb.close();
				return callback(err);
			}
			// 查找用户名(name键)的值为name一个文档
			collection.findOne({
				name: name
			}, function(err, user){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, user);
			})
		})
	})
}

// 返回所有用户信息
User.getAll = function (callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			callback(err);
		}
		// 读取Posts集合
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				callback(err);
			}
			// 返回包含name, time, title属性的文档组成的存档数组
			collection.find({}, {
				"name": 1,
				"email": 1,
				"nickname": 1,
				"sex": 1,
				"age": 1,
				"phone": 1,
				"address": 1,
				"isDisabled": 1
			}).sort({
				time: -1
			}).toArray(function(err, docs) {
				mongodb.close();
				if (err) {
					callback(err);
				}
				docs = docs.reverse();
				callback(null, docs);
			});
		});
	});
}

User.updateAble = function (name, isDisabled, reason, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('users', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// 更新文章内容
			collection.update({
				name: name
			}, {
				$set: {
					isDisabled: isDisabled,
					reason: reason
				}
			}, function(err) {
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
}

module.exports = User;