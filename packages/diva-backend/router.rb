#!/usr/local/bin/ruby -rubygems

require 'sinatra'
require 'rethinkdb'

rdb_config ||= {
  :host       => ENV['RETHINKDB_HOST']       || 'localhost',
  :port       => ENV['RETHINKDB_PORT']       || 28015,
  :db         => ENV['RETHINKDB_NAME']       || 'diva',
  :user       => ENV['RETHINKDB_USERNAME']   || 'admin',
  :password   => ENV['RETHINKDB_PASSWORD']   || ''
}

r = RethinkDB::RQL.new

configure do
  set :db, rdb_config[:db]
  begin
    connection = r.connect(**rdb_config)
  rescue Exception => err
    puts "Cannot connect to RethinkDB database #{rdb_config[:host]}:#{rdb_config[:port]} (#{err.message})"
    Process.exit(1)
  end

  begin
    r.db_create(rdb_config[:db]).run(connection)
  rescue RethinkDB::RqlRuntimeError => err
    puts "Database #{rdb_config[:db]} already exists."
  end

  begin
    r.db(rdb_config[:db]).table_create('offers').run(connection)
  rescue RethinkDB::RqlRuntimeError => err
    puts "Table `offers` already exists."
  ensure
    connection.close
  end
end


before do
  begin
    @rdb_connection = r.connect(**rdb_config)
  rescue Exception => err
    logger.error "Cannot connect to RethinkDB database #{rdb_config[:host]}:#{rdb_config[:port]} (#{err.message})"
    halt 501, 'This page could look nicer, unfortunately the error is the same: database not available.'
  end
end

after do
  begin
    @rdb_connection.close if @rdb_connection
  rescue
    logger.warn "Couldn't close connection"
  end
end

post '/offers' do
  params[:created_at] = Time.now.to_i

  result = r.table('offers').insert(params).run(@rdb_connection)

  if result['inserted'] == 1
    id = result['generated_keys'].first

    { offer: { id: id, link: "/offers/#{id}", created_at: Time.now.to_i } }.to_json
  else
    logger.error result
    redirect '/'
  end
end

get '/offers/:id' do
  @offer = r.table('offers').get(params[:id]).run(@rdb_connection)

  if @offer
    @offer.to_json
  else
    redirect '/'
  end
end
