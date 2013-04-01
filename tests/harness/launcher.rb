#!/usr/bin/ruby
# launches a series of clients

ID_OFFSET   = ARGV.shift.to_i || 100

NUM_CLIENTS = 5
NUM_MSGS    = 20 # per client
NODE_ID     = 'rjr_test_launcher-'
MSG_IDS     = ['stress', 'stress_callback']
TRANSPORTS  = {#:amqp =>     'rjr_test_server-queue',
               #:tcp  => 'json-rpc://localhost:8181',
               :ws   => 'json-rpc://localhost:8080',
               #:www  =>     'http://localhost:8888'
              }
BROKER      = 'localhost' # only used for amqp
MSG_INTERVAL= 3

CLIENT = File.join(File.dirname(__FILE__), 'client.rb')

threads = []

0.upto(NUM_CLIENTS) { |i|
  transport = TRANSPORTS.keys[rand(TRANSPORTS.keys.size)]
  dst       = TRANSPORTS[transport]
  mode      = rand(2) == 0 ? :msg : :rand
  node_id   = NODE_ID + (i + ID_OFFSET).to_s
  msg_id    = MSG_IDS[rand(MSG_IDS.size)]

  threads <<
    Thread.new{
      system("#{CLIENT} -m #{mode} -t #{transport} -i #{node_id} -b #{BROKER} --dst #{dst} -n #{NUM_MSGS} --message #{msg_id} --interval #{MSG_INTERVAL}")
    }
}

threads.each { |t| t.join }
