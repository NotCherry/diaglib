import { server } from "typescript";
import Graph from "../Graph";
import { OAIAPI, OAIResponse } from "../types";

type SocketMessage = {
  type: string;
  data: any;
};

export default class Connection {
  static restarting: boolean = false;
  static conn: WebSocket;
  static lastUpdatedNode: string = "";
  static url: string;
  static maxTokens: number;
  static temperature: number;
  constructor(apiURL: string, maxTokens: number, temperature: number) {
    Connection.setup_conn(apiURL);
    Connection.maxTokens = maxTokens;
    Connection.temperature = temperature;
  }
  static async reconnect(apiURL, data) {
    if (Connection.restarting) {
      console.warn("Do not abuse");
      return;
    }
    Connection.restarting = true;
    console.log("Reconnecting...");
    await Connection.setup_conn(apiURL);
    if (Connection.conn instanceof WebSocket) {
      setTimeout(() => {
        Connection.send(data);
      }, 1000);
      return;
    }
    Connection.reconnect(apiURL, data);
  }

  static async setup_conn(apiURL: string) {
    Connection.url = apiURL;
    Connection.conn = await new WebSocket(apiURL);
    Connection.conn.onopen = () => {
      console.log("Connection established");
      Connection.restarting = false;
    };
    Connection.conn.onerror = () => {
      console.error("Hit error");
      Connection.destroy();
      Connection.reconnect(Connection.url, "");
    };
    Connection.conn.onclose = () => {
      console.warn("Hit close");
      Connection.destroy();
      Connection.reconnect(Connection.url, "");
    };
    Connection.conn.onmessage = (msg: SocketMessage) => {
      updateDiagram(msg);
    };
  }

  static destroy() {
    if (Connection.conn instanceof WebSocket) {
      console.log("Connection Destroyed");
      Connection.conn.close();
      Connection.conn = null;
    }
  }

  static send(data: any) {
    if (!(Connection.conn instanceof WebSocket)) {
      Connection.reconnect(Connection.url, data);
    }
    if (Connection.conn.readyState) {
      Connection.conn.send(data);
    }
  }
}

async function update_node(node) {
  const targetNode = Graph.nodeMap.get(node.id);
  if (targetNode == undefined || targetNode.type == "output") {
    return;
  }
  targetNode.updateData(node.data);
}

async function updateDiagram(msg: SocketMessage) {
  const req: SocketMessage = JSON.parse(msg.data);
  console.warn(req.type);
  if (req.type === "update_node") {
    let node = req.data;
    if (Connection.lastUpdatedNode !== node.id) {
      Graph.nodeMap.get(node.id)!.color = "green";
      if (Connection.lastUpdatedNode !== "") {
        Graph.nodeMap.get(Connection.lastUpdatedNode)!.color = "";
      }
      Graph.render();
    }

    Connection.lastUpdatedNode = node.id;

    update_node(node);
    Graph.render();
  }
  if (req.type === "run_local") {
    let node = req.data;

    const requestPayload = {
      model: "llama-3.2-1b-instruct", // Replace with your model name
      messages: node.data.messages,
      max_tokens: Connection.maxTokens > 0 ? Connection.maxTokens : undefined,
      temperature: Connection.temperature,
    };

    let response;
    try {
      console.log("Sending request to local API", requestPayload);
      response = await fetch(node.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload), // Convert the payload to JSON
      });
      console.log("THE RESPONSE");
    } catch (error) {
      console.error("We got problemm");
      const server_broke_connection_msg = {
        type: "local_conn_error",
        data: "cors",
      };
      Connection.send(JSON.stringify(server_broke_connection_msg));
      Graph.generatingContent = false;
      Graph.executionErrors = [
        ...Graph.executionErrors,
        { name: "CORS", message: "Local server is not working" },
      ];
      dispatchEvent(new CustomEvent("execError", { detail: "cors" }));
      return;
    }

    const data: OAIAPI = await response.json();
    if (!data || data.choices.length < 1) {
      return;
    }

    const llmResponse = data.choices[0].message.content;
    const server_back_message = { type: "local_llm", data: llmResponse };

    Connection.send(JSON.stringify(server_back_message));
    update_node({ data: llmResponse, id: node.data.id });
  }
  if (req.type === "run_compleated") {
    Graph.generatingContent = false;
    console.log(req.type, req.data);
    Graph.returnLastContent(req.data.text);
  }
  Connection.lastUpdatedNode = "";
}
