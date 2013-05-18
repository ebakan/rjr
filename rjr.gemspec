# -*- encoding: utf-8 -*-

GEM_NAME    = 'rjr'
PKG_VERSION = '0.13.1'

PKG_FILES =
  Dir.glob('{lib,specs,tests}/**/*.rb') + ['LICENSE', 'Rakefile', 'README.md']


Gem::Specification.new do |s|
    s.name    = GEM_NAME
    s.version = PKG_VERSION
    s.files   = PKG_FILES
    s.executables   = ['rjr-server', 'rjr-client', 'rjr-client-launcher']
    s.require_paths = ['lib']

    s.required_ruby_version = '>= 1.8.1'
    s.required_rubygems_version = Gem::Requirement.new(">= 1.3.3")
    s.add_development_dependency('rspec', '~> 1.3.0')
    s.add_dependency('eventmachine', '= 1.0.1') # rjr is incompatible current release 1.0.3 and one before it 1.0.2 and 1.0.0 and before
    s.add_dependency('json') # TODO use multi_json

    s.requirements = ['amqp gem is needed to use the amqp node',
                      'eventmachine_httpserver and em-http-request gems are needed to use the web node',
                      'em-websocket and em-websocket-client gems are needed to use the web socket node']

    s.author = "Mohammed Morsi"
    s.email = "mo@morsi.org"
    s.date = %q{2013-05-17}
    s.description = %q{Ruby Json Rpc library}
    s.summary = %q{JSON RPC server and client library over amqp, websockets, http, etc}
    s.homepage = %q{http://github.com/movitto/rjr}
end
