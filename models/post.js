var mongodb = require('./db'),
	markdown = require('markdown').markdown;

function Post(name, title, post){
	this.name = name;
	this.title = title;
	this.post = post;
}

Post.prototype.save = function(callback){
	var date = new Date();

	// 存储各种事件格式，方面以后扩展
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + '-' + (date.getMonth() + 1),
		day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
		minute: date.getFullYear() 
				+ '-' + (date.getMonth() + 1) 
				+ '-' + date.getDate()
				+ ' ' + date.getHours() 
				+ ':' + ( date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	};

	// 要存入数据库的文档
	var post = {
		name: this.name,
		time: time,
		title: this.title,
		post: this.post,
		comments: []
	};

	// 打开数据库
	mongodb.open(function(err, db) {
		if(err){
			return callback(err);
		}
		// 读取posts集合
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			// 将文档插入posts集合
			collection.insert(post, {
				safe: true
			}, function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);  // 返回err为null，也就是正常时候的方法。
			});
		});
	});
};

// 读取所有文章及其相关信息
Post.getAll = function(name, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		// 读取posts集合
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			var query = {};
			if(name){
				query.name = name;
			}
			// 根据query对象查询文章
			collection.find(query).sort({
				time: -1
			}).toArray(function(err, docs){
				mongodb.close();
				if(err){
					return callback(err); //失败！返回err
				}
				// 解析Markdown为html
				docs.forEach(function(doc){
					doc.post = markdown.toHTML(doc.post);
				})
				callback(null, docs); // 成功！以数组形式返回查询的结果
			});
		});
	});
};

// 获取十篇文章
Post.getTen = function (name, page, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			callback(err);
		}
		// 读取posts集合
		db.collection('posts', function(err, collection) {
			if (err) {
				callback(err);
			}
			var query = {};
			if (name) {
				query.name = name;
			}
			// 使用Count返回特定查询的文档数total
			collection.count(query, function(err, total) {
				// 根据query对象查询，并跳过前(page-1)*10个结果，返回之后的10个结果
				collection.find(query, {
					// 不建议使用skip和limit，更应上网查询更好的方法
					skip: (page - 1) * 10,
					limit: 10
				}).sort({
					time: -1
				}).toArray(function(err, docs) {
					mongodb.close();
					if (err) {
						callback(err);
					}
					// 解析Markdown为html
					docs.forEach(function(doc) {
						doc.post = markdown.toHTML(doc.post);
					});
					callback(null, docs, total);
				});
			});
		});
	});
}

// 获取一篇文章
Post.getOne = function(name, day, title, callback){
	// 打开数据库
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		// 读取posts集合
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			// 根据用户名、发表日期及文章名进行查询
			collection.findOne({
				'name': name,
				'time.day': day,
				'title': title
			}, function(err, doc){
				if(err){
					mongodb.close();
					return callback(err);
				}
				if(doc){
					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function (comment) {
						comment.content = markdown.toHTML(comment.content);
					});
				}
				callback(null, doc);
			});
		});
	});
};

// 返回原始发表的内容(markdown格式)
Post.edit = function(name, day, title, callback) {
	// 打开数据库
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		// 读取posts集合
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			// 根据用户名、发表日期及文章名进行查询
			collection.findOne({
				'name': name,
				'time.day': day,
				'title': title
			}, function(err, doc){
				if(err){
					mongodb.close();
					return callback(err);
				}
				callback(null, doc);
			});
		});
	});
};

Post.update = function (name, day, title, post, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// 更新文章内容
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$set: {post: post}
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

Post.remove = function (name, day, title, callback) {
	// 打开数据库
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		};
		db.collection('posts', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// 根据用户名、日期和标题查找并删除一篇文章
			collection.remove({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				w: 1
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

module.exports = Post;