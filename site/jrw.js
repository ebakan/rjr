/* Json-Rpc over Websockets
 */

// helpers to generate 'uuid'
function S4() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
function guid() {
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

// encapsulates a json-rpc message
function JRMessage(msg){
  this.json = msg;
  this.parsed = $.evalJSON(msg);

  this.id     = this.parsed['id'];
  this.method = this.parsed['method'];
  if(this.parsed['params']){
    this.params = this.parsed['params'];
    for(p=0;p<this.params.length;++p){
      if(JRObject.is_jrobject(this.params[p]))
        this.params[p] = JRObject.from_json(this.params[p]);
      else if(JRObject.is_jrobject_array(obj[p]))
        this.params[p] = JRObject.from_json_array(this.params[p]);
    }
  }
  this.error  = this.parsed['error'];
  this.result = this.parsed['result'];
  if(this.result && JRObject.is_jrobject(this.result))
    this.result = JRObject.from_json(this.result);
  else if(JRObject.is_jrobject_array(this.result))
    this.result = JRObject.from_json_array(this.result);
}

// encapsulates an object w/ type
//  - adaptor for the ruby 'json' library
function JRObject (type, value){
  this.type  = type;
  this.value = value;
  this.toJSON = function(){
     var data = {};
     for(p in value)
       if(p != "toJSON")
         data[p] = value[p];
     return {json_class: this.type, data: data };
  };
};

JRObject.is_jrobject = function(json){
  return json && json['json_class'] && json['data'];
};

JRObject.is_jrobject_array = function(json){
  return json && typeof(json) == "object" && json.length > 0 && JRObject.is_jrobject(json[0]);
};

JRObject.from_json = function(json){
  // TODO lookup class corresponding in global registry and instantiate
  //var cl  = JRObject.class_registry[json['json_class']];
  var obj = json['data'];
  obj.json_class = json['json_class'];
  for(var p in obj){
    if(JRObject.is_jrobject(obj[p]))
      obj[p] = JRObject.from_json(obj[p]);
    else if(JRObject.is_jrobject_array(obj[p])){
      obj[p] = JRObject.from_json_array(obj[p]);
   }
  }
  return obj;
};

JRObject.from_json_array = function(json){
  var objs = [];
  for(var i in json)
    if(JRObject.is_jrobject(json[i]))
      objs[i] = JRObject.from_json(json[i]);
  return objs;
};

// global / shared class registry
//JRObject.class_registry = {};

// main json-rpc websocket interface
function WSNode (host, port){
  var node = this;
  this.open = function(){
    this.socket = new MozWebSocket("ws://" + host + ":" + port);
    this.socket.onopen = function (){
      // XXX hack, give other handlers time to register
      setTimeout(function(){
        if(node.onopen)
          node.onopen();
      }, 250);
    };
    this.socket.onclose   = function (){
      if(node.onclose)
        node.onclose();
    };
    this.socket.onmessage = function (e){
      msg = new JRMessage(e.data);
      if(node.onmessage)
        node.onmessage(msg);
    };
  };
  this.invoke_request = function(){
    id = guid();
    rpc_method = arguments[0];
    args = [];
    for(a = 1; a < arguments.length; a++){
        args.push(arguments[a]);
    }
    request = {jsonrpc:  '2.0',
               method: rpc_method,
               params: args,
               id: id};
    this.onmessage = function(msg){
      if(this.message_received)
        this.message_received(msg);
      if(msg['id'] == id){
        success = !msg['error'];
        if(success && this.onsuccess){
          result = msg['result'];
          this.onsuccess(result);
        }
        else if(!success && this.onfailed)
          this.onfailed(msg['error']['code'], msg['error']['message']);
      }else{
        if(msg['method'] && this.invoke_callback){
          params = msg['params'];
          this.invoke_callback(msg['method'], params);
        }
      }
    };
    this.socket.send($.toJSON(request));
  };
  this.close = function(){
    this.socket.close();
  };
};

// main json-rpc www interface
function WebNode (uri){
  var node = this;
  this.invoke_request = function(){
    id = guid();
    rpc_method = arguments[0];
    args = [];
    for(a = 1; a < arguments.length; a++){
        args.push(arguments[a]);
    }
    request = {jsonrpc:  '2.0',
               method: rpc_method,
               params: args,
               id: id};

    $.ajax({type: 'POST',
            url: uri,
            data: $.toJSON(request),
            dataType: 'text', // using text so we can parse json ourselves
            success: function(data){
              data = new JRMessage(data);
              if(node.message_received)
                node.message_received(data);
              success = !data['error'];
              if(success && node.onsuccess){
                result = data['result'];
                node.onsuccess(result);
              }
              else if(!success && node.onfailed)
                node.onfailed(data['error']['code'], data['error']['message']);
            },
            error: function(jqXHR, textStatus, errorThrown){
              if(node.onfailed)
                node.onfailed(jqXHR.status, textStatus);
            }});
  };
};