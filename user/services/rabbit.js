const amqp = require('amqplib');

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
    try {
        if (connection) {
            return connection;
        }

        // Connect to RabbitMQ server
        const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
        console.log('Connecting to RabbitMQ:', rabbitUrl.replace(/\/\/.*@/, '//*****@')); // Hide credentials in log
        connection = await amqp.connect(rabbitUrl);
        console.log('RabbitMQ connected successfully');

        // Create a channel
        channel = await connection.createChannel();

        // Handle connection close
        connection.on('close', () => {
            console.log('RabbitMQ connection closed');
            connection = null;
            channel = null;
        });

        // Handle connection error
        connection.on('error', (err) => {
            console.error('RabbitMQ connection error:', err);
            connection = null;
            channel = null;
        });

        return connection;
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        throw error;
    }
};

const getChannel = async () => {
    if (!channel) {
        await connectRabbitMQ();
    }
    return channel;
};

const publishToQueue = async (queue, message) => {
    try {
        const ch = await getChannel();
        await ch.assertQueue(queue, { durable: true });
        ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
            persistent: true
        });
        console.log(`Message sent to queue ${queue}:`, message);
    } catch (error) {
        console.error('Error publishing to queue:', error);
        throw error;
    }
};

const consumeFromQueue = async (queue, callback) => {
    try {
        const ch = await getChannel();
        await ch.assertQueue(queue, { durable: true });
        
        console.log(`Waiting for messages in queue: ${queue}`);
        
        ch.consume(queue, (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                console.log(`Received message from queue ${queue}:`, content);
                callback(content, msg);
                ch.ack(msg);
            }
        });
    } catch (error) {
        console.error('Error consuming from queue:', error);
        throw error;
    }
};

const publishToExchange = async (exchange, routingKey, message) => {
    try {
        const ch = await getChannel();
        await ch.assertExchange(exchange, 'topic', { durable: true });
        ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
            persistent: true
        });
        console.log(`Message published to exchange ${exchange} with routing key ${routingKey}:`, message);
    } catch (error) {
        console.error('Error publishing to exchange:', error);
        throw error;
    }
};

const subscribeToExchange = async (exchange, queue, routingKey, callback) => {
    try {
        const ch = await getChannel();
        await ch.assertExchange(exchange, 'topic', { durable: true });
        await ch.assertQueue(queue, { durable: true });
        await ch.bindQueue(queue, exchange, routingKey);
        
        console.log(`Subscribed to exchange ${exchange} with routing key ${routingKey}`);
        
        ch.consume(queue, (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                console.log(`Received message from exchange ${exchange}:`, content);
                callback(content, msg);
                ch.ack(msg);
            }
        });
    } catch (error) {
        console.error('Error subscribing to exchange:', error);
        throw error;
    }
};

const closeConnection = async () => {
    try {
        if (channel) {
            await channel.close();
        }
        if (connection) {
            await connection.close();
        }
        console.log('RabbitMQ connection closed successfully');
    } catch (error) {
        console.error('Error closing RabbitMQ connection:', error);
    }
};

module.exports = {
    connectRabbitMQ,
    getChannel,
    publishToQueue,
    consumeFromQueue,
    publishToExchange,
    subscribeToExchange,
    closeConnection
};
