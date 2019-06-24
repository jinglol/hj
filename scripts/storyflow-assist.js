var Property = {
	SCREEN_WIDTH  : 1200,
	SCREEN_HEIGHT : 250,
	MARGIN_LEFT : 50,
	TUBE_WIDTH : 3,
	TUBE_SELECT_WIDTH : 5,
	BRACKET_WIDTH : 3,
	BRACKET_MARGIN : 3,
	TIMESTEP_SIZE : 96,
	// TIMESTEP_WIDTH : parseFloat(this.SCREEN_WIDTH / this.TIMESTEP_SIZE),
	TIMESTEP_WIDTH : 0,
	SESSION_SPACE : 20,
	TUBE_SPACE : 3,
	BEZIER_K : 0.05,
	WINDOW_WIDTH : 1200,
	WINDOW_HEIGHT : 500
}

function AlignPair(step) {
	this.step = step;

	this.lList = [];
	this.rList = [];
	
	this.addPair = function(l, r) {
		this.lList.push(l);
		this.rList.push(r);
	}
}

function Cluster(ID) {
	this.id = ID;
	this.top = 0;	//这里没有赋初始值是血泪的教训
	this.left;
	this.right;
	this.height = 0;
	this.start;
	this.end;

	this.ClusterSe = [];
	this.value_diff = [];

	//获取Cluster内部最后一个session
	this.getLatest = function() {
		return this.ClusterSe[this.ClusterSe.length - 1];
	}
	//判断两个Cluster是否相互覆盖
	this.overlap = function(cluster) {	//与session中同名函数，后改正
		if(this.left >= cluster.right || this.right <= cluster.left) {
			return false;
		} else {
			return true;
		}
	}
	//获取Cluster在时间步伐step时刻的session
	this.getSeCurrent = function(step) {
		for(var i = 0; i < this.ClusterSe.length; i++) {
			var se = this.ClusterSe[i];
			if(se.isContain(step)){
				return se;
			}
		}
		return null;
	}
	//当前Cluster和它下面的Cluster之间间距是否过大
	this.isSatisfied = function(cluBottom) {
		var flag = false;
		var start = Math.max(this.start, cluBottom.start);
		var end = Math.min(this.end, cluBottom.end);
		for(var i = 0; i < this.ClusterSe.length; i++) {
			var seCurrent = this.ClusterSe[i];
			if(seCurrent.start >= end || seCurrent.end <= start){
			} else {
				for(var j = 0; j < cluBottom.ClusterSe.length; j++) {
					var seBottom = cluBottom.ClusterSe[j];
					if(seBottom.start >= end || seBottom.end <= start){
					} else {
						if(!seCurrent.overlap_se(seBottom)){ //两个session时间有重叠，才计算
							continue;
						}
						if((seBottom.left_y-seCurrent.left_y-seCurrent.height)==Property.SESSION_SPACE){
							flag = true;
						}
					}
				}
			}
		}
	}
	//根据上面Cluster计算当前Cluster的最优Top值
	this.getTopSession = function(cluTop) {
		var floor = 0;
		var start = Math.max(this.start, cluTop.start);
		var end = Math.min(this.end, cluTop.end);
		//////一样的
		// console.log("start: " + start + ", end: " + end);
		for(var i = 0; i < cluTop.ClusterSe.length; i++) {
			var seTop = cluTop.ClusterSe[i];
			if(seTop.start >= end || seTop.end <= start){
			} else {
				for(var j = 0; j < this.ClusterSe.length; j++) {
					var seCurrent = this.ClusterSe[j];
					if(seCurrent.start >= end || seCurrent.end <= start){
					} else {
						if(!seTop.overlap_se(seCurrent)){ //两个session时间有重叠，才计算
							// console.log(j);
							continue;
						}
						var temp = parseFloat(seTop.left_y + seTop.height + Property.SESSION_SPACE
														- this.value_diff[j]);//***

						// console.log("i:"+i+", j:" + j +",   seTop.left_y: " + seTop.left_y + ", seTop.height: " + seTop.height + ", this.value_diff[j]: " + this.value_diff[j]);
						floor = Math.max(floor, temp);
					}
				}
			}
		}
		//////这里不一样
		// console.log("floor: "+floor);
		return floor;
	}
	//根据下面的Cluster下移当前Cluster
	this.shiftDown = function(seBottomList) {
		var floor = seBottomList[0].left_y;
		for(var i = 0; i < this.ClusterSe.length; i++) {
			var seCurrent = this.ClusterSe[i];
			for(var j = 0; j < seBottomList.length; j++) {
				var seBottom = seBottomList[j];
				if(seCurrent.overlap_se(seBottom)){
					var temp = parseFloat(seBottom.left_y- this.value_diff[this.ClusterSe.indexOfId(seCurrent)]
												-seCurrent.height-Property.SESSION_SPACE);
					floor = Math.min(floor, temp);
					break;
				}
			}
		}
		return floor;
	}

	//计算Cluster内部Session.left_y与cluster.top的间距
	this.getDiffValue = function() {	//计算Cluster内部Session.left_y与cluster.top的间距
//		this.value_diff = new Array(this.ClusterSe.length);
//		var temp = new Array(this.ClusterSe.length);
		//声明并初始化value_diff和temp
		this.value_diff = new Array();
		var temp = new Array();
		for(var i = 0; i < this.ClusterSe.length; i++) {
			this.value_diff[i] = 0.0;
			temp[i] = 0.0;
		}
		
//		temp[0] = 0;
		for(var mark = 0; mark < this.ClusterSe.length - 1; mark++) {
			var share = new Array();
			var hash =  new HashMap();
			var sL = this.ClusterSe[mark];
			var sR = this.ClusterSe[mark + 1];

			var keyOptimal = 0;
			//share.push(sL.members);
			share.pushAll(sL.members);
			share = share.filter(function (me) {
				return (sR.members.indexOfId(me) == -1)?false:true;
			});
			//声明并初始化D_value
			var D_value = new Array();
			for(var i = 0; i < share.length; i++) {
				D_value[i] = 0;
			}
			//
			var hashKeySet = new Array();
			for(var i = 0; i < share.length; i++) {
				var s = share[i];
				D_value[share.indexOfId(s)] = sL.members.indexOfId(s)
						- sR.members.indexOfId(s);
			}
			for (var i = 0; i < D_value.length; i++) {
				try {
					if (!hash.isEmpty() && hash.containsKey(D_value[i])) {
						hash.get(D_value[i]).push(share[i]);
						hash.put(D_value[i], hash.get(D_value[i]));
					} else {
						var tempMember = new Array();
						tempMember.push(share[i]);
						hash.put(D_value[i], tempMember);
						// console.log("D_value["+i+"]: " + D_value[i]);
						hashKeySet.push(D_value[i]);
					}
				} catch(e) {
					console.error(e);
					console.log("exception at Cluster.getDiffValue" );
				}
			}
			var segmentRelative = 0;
			for(var i = 0; i < hashKeySet.length; i++) {
				var key = hashKeySet[i];
				if(segmentRelative < hash.get(key).length) {
					keyOptimal = key;
					segmentRelative = hash.get(key).length;
				}
			}
			temp[mark+1]=keyOptimal * (Property.TUBE_WIDTH + Property.TUBE_SPACE);
		}
		for(var index=0;index < this.value_diff.length;index++){
			this.value_diff[index]=0;
			for(var i=0;i<=index;i++){
				this.value_diff[index]+=temp[i];
			}
			//////这里value_diff里面的值是一样的
			// console.log("value_diff["+index+"]" + this.value_diff[index]);
		}
	}	
}
//自写hash类
function HashMap() {
	this.put = function(key,value)	{this[key] = value;}
    this.get = function(key)	{return this[key];}
    this.containsKey = function(key)	{
 //   	console.log("this.get(key): t or f :  " + (this.get(key) == null) || (this.get(key) == undefined));
 //   	console.log("this.get(key): null :  " + (this.get(key) == null));
    	return ((this.get(key) == null) || (this.get(key) == undefined))?false:true;}
    this.remove = function(key)	{delete this[key];}
    this.isEmpty = function() { return this.length == 0;}
}
// 用于记录某一个场景中所有的实体片段及其起止时间步伐
function InterSlot(id, member, session, weight) {
	//变量
	this.sessions = [];
	this.listTime = [];
	//构造函数部分
	this.id = id;
	this.member = member;
	this.weight = weight;
	if(Array.isArray(session)) {
		this.sessions = session;
	} else {
		this.sessions.push(session);
	}
	//函数部分
	this.getSeTime = function() {
		for(var i = 0; i < this.sessions.length; i++) {
			var se = this.sessions[i];
			if(this.listTime.length>0){
				if(se.start==this.listTime[this.listTime.length-1].end){
					this.listTime[this.listTime.length-1].end=se.start;
				}
				else{
					this.listTime.push(new Start_Stop(se.start,se.end));
				}
			}
			else{
				this.listTime.push(new Start_Stop(se.start,se.end));
			}
		}
	}
	this.inInterval = function(i) {
		for(var i = 0; i < this.listTime.length; i++) {
			var time = this.listTime[i];
			if(time.isInSlot(i)){
				return true;
			}
		}
		return false;
	}
}

function Start_Stop(start, end) {
	//构造函数
	this.start = start;
	this.end = end;
	//函数
	this.isInSlot = function(start) {
		if(this.start>=start+1 || this.end<=start){
			return false;
		}
		else
			return true;
	}
	this._isInSlot = function(timestep) {
		if(timestep>=start && timestep<=end)
			return true;
		else
			return false;
	}

}
/////////////////////三个比较器???

//存储排序的结构 
function Order_Timestep(order, timestep, memberId, subtree, interSession) {
	if(arguments.length == 0) {
		this._order=0;
		this._timestep=-1;
		this._memberId=-1;
		this._subtree=null;
		this._interSession=null;
	} else {
		this._order=order;
		this._timestep=timestep;
		this._memberId=memberId;
		this._subtree=subtree;
		this._interSession=interSession;
	}
}

function Pair() {
	this.lList = [];
	this.rList = [];
	this.addPair = function(l, r) {
		this.lList.push(l);
		this.rList.push(r);
	}	
}

//LCS
var LCS = {
	lcsPair : new Pair(),
	lcsLength : function(x, y, b) {
		var m = x.length;
		var n = y.length;
		//二维数组定义
		var c = new Array();
		for (var i = 0; i <= m; i++){
			c[i] = new Array();
			for(var j = 0; j <= n; j++) {
				c[i][j] = 0;
			}
		}
		////这一部分合并到前面的循环中吧
//		for(var i = 0; i <= m; i++) {
//			c[i][0] = 0;
//		}
//		for(var i = 0; i <= n; i++) {
//			c[0][i] = 0;
//		}
		for(var i = 1; i <= m; i++) {
			for (var j = 1; j <= n; j++) {
				c[i][j] = c[i-1][j-1] + this.similar(x, i-1, y, j-1);
//				console.log("this.similar(x, i-1, y, j-1) : " +this.similar(x, i-1, y, j-1));
				b[i][j] = 1;
				if (c[i][j] <= c[i - 1][j]) {
					c[i][j] = c[i - 1][j];
					b[i][j] = 2;
				}
				if (c[i][j] <= c[i][j - 1]) {
					c[i][j] = c[i][j - 1];
					b[i][j] = 3;
				}
			}
		}
		this.lcsPair.lList.splice(0, this.lcsPair.lList.length);
		this.lcsPair.rList.splice(0, this.lcsPair.rList.length);
//		console.log("this.lcs(m, n, b) : " + ", m : " + m + " , n : " + n);
/*
		console.log("b[][]");
		for(var i = 0; i <= m; i++) {
			for (var j = 0; j <= n; j++) { 
				console.log("b[" +i + "][" + j +"] : "+ b[i][j] + " ");
			}
		}
*/
		this.lcs(m, n, b);
	},
	similar : function(SL, li, SR, rj) {
		var r = 0.1;
		var simValue;
		var relative = r*(1-d3.round(Math.abs(((li+1)/SL.length)-((rj+1)/SR.length))));
//		console.log("relative : " +relative);
		var straight = this.straight(SL[li],SR[rj]);
//		console.log("straight : " +straight);
		simValue=straight+relative;
		if(straight==0){
			simValue=0.0;
		}
		return simValue;
	},
	straight : function(sL, sR) {
		var segmentShare = 0;
		var hash = new HashMap();
		var share = [];
		share.pushAll(sL.members);
		share = share.filter(function (me) {
			return (sR.members.indexOfId(me) == -1)?false:true;
		});
//		console.log(share.length);
		var D_value = new Array();
		//初始化D_value
		for(var i = 0; i < share.length; i++) {
			D_value[i] = 0;
		}
		var hashKeySet = new Array();
		for(var i = 0; i < share.length; i++) {
			var s = share[i];
			D_value[i] = sL.members.indexOfId(s)
					- sR.members.indexOfId(s);
	//		console.log("D_value[share.indexOf(s)] : " + D_value[share.indexOf(s)]);
		}
//		console.log(D_value.length);
///////////////////////////////////////////////错误在这里，hashKeySet.length不一样
		for (var i = 0; i < D_value.length; i++) {
			try {
//				console.log("id = " + i + " hash.containsKey(D_value[i]) " + hash.containsKey(D_value[i]) );
				if (!hash.isEmpty() && hash.containsKey(D_value[i])) {
					hash.put(D_value[i], hash.get(D_value[i]) + 1);
				} else {
					hash.put(D_value[i], 1);
					hashKeySet.push(D_value[i]);
//					console.log("id = " + i + "  hashKeySet.push(D_value[i]); ");
				}
			} catch(e) {
				console.error(e);
				console.log("exception at LCS.straight()");
			}
		}
//		console.log(hashKeySet.length);
		for(var i = 0; i < hashKeySet.length; i++) {
			var key = hashKeySet[i];
			if(segmentShare < hash.get(key)) {
				segmentShare = hash.get(key);
			}
		}
		return segmentShare;
	},
	lcs : function(i, j, b) {
		if (i == 0 || j == 0)
			return;
		if (b[i][j] == 1) {
			this.lcs(i - 1, j - 1, b);
//			console.log("this.lcsPair.addPair(i-1, j-1) : " + (i-1) + " , " + (j-1));
			this.lcsPair.addPair(i-1, j-1);
		} else if (b[i][j] == 2){
			this.lcs(i - 1, j, b);
		}
		else{
			this.lcs(i, j - 1, b);
		}
	}
};

///////////////////////////////////???
//List转换成数组[],这里使用js是不是不用这么转嘞，那么这个函数就无用
var Traverse = {
	traverse : function(seList) {
		var seArray = new Array();
		for(var index = 0;index < seList.length; index++){
			seArray[index] = seList[index];
		}
		return seArray;
	}
}
//////正序扫描比较器
function ComparatorMemberPosInv(referList) {
	this.referList = referList;
//	console.log("newnew this.referList[0].id : " + this.referList[0].id);
//	console.log("newnew referList[0].id : " + referList[0].id);
	this.comparePosInv = function(user0, user1) {
		// 首先,比较segment在参照序列中的编号。如果相同(-1,新出现的)，再比较它们id。
		var i0 = 0;
		var i1 = 0;
		//修改
//		console.log("typeof(user0) : " + typeof(user0));
//		console.log("hahahhaha referList[0].id : " + referList[0].id);
		if(referList.indexOfId(user0) == -1){
			// if(user0.id==12 || user0.id==5 || user0.id==6 || user0.id==8|| user0.id==7 || user0.id==13){
			// 	i0 = 10;
			// }else if(user0.id==12){
			// 	i0 = -1;
			// }
			/*
			if(user0.id==5 || user0.id==7 || user0.id==8){
				//
				i0=-2;
			}
			else{
				i0 = 0;
			}
			*/
			if(user0.id==0 || user0.id==1 || user0.id==13){
				//
				i0=10;
			}
			else{
				i0 = 0;
			}
			i0 = 0;
		}else{
			i0 = referList.indexOfId(user0) + 1;
		}
		
		if(referList.indexOfId(user1) == -1){
			// if(user1.id==12 || user1.id==5 || user1.id==6 || user1.id==8|| user1.id==7 || user1.id==13){
			// 	//
			// 	i1=10;
			// }else if(user1.id==12){
			// 	i1=-1;
			// }
			/*
			if(user1.id==5 || user1.id==7 || user1.id==8){
				//
				i1=-2;
			}
			else{
				i1 = 0;
			}
			*/
			// i1 = 0;
			if(user1.id==0 || user1.id==1 || user1.id==13){
				//
				i1=10;
			}
			else{
				i1 = 0;
			}
		}else{
			i1 = referList.indexOfId(user1)+1;
		}

		var flag = i0-i1;
		if(flag == 0){ //
			var t0 = user0.id;
			var t1 = user1.id;
			return t0 - t1;
		}
		else{
			return flag;
		}
	}
}
///
function ComparatorSession() {
	this.compareSe = function(user0, user1) {
		// var s0 = "" + user0.weight;
		// var s1 = "" + user1.weight;
		
		// var flag = s0.localeCompare(s1);
		// if(flag == 0){ //
		// 	var t0 = "" + user0.id;
		// 	var t1 = "" + user1.id;
		// 	return t0.localeCompare(t1);
		// }
		// else
		// {
		// 	return flag;
		// }
		var flag=0;
		if(user0.weight>user1.weight){
			flag=1;
		}
		else if(user0.weight<user1.weight){
			flag=-1;
		}
		else{
			flag=0;
		}
		if(flag==0){ 
			return user0.id-user1.id;
		}
		else
		{
			return flag;
		}
	}
}