require './router'
require 'rack/contrib'
use Rack::JSONBodyParser
run Sinatra::Application
