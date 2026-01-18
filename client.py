#!/usr/bin/env python3
"""
MCP Client for Minecraft Datapack Development
Connects to the MineCode MCP Server and calls its tools
"""

import asyncio
import json
import sys
import os
from mcp import ClientSession
from mcp.client.stdio import stdio_client, StdioServerParameters


async def create_client_session():
    """Create and initialize MCP client session"""
    # Get the path to the server script
    server_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server.py")
    
    # Server parameters
    server_params = StdioServerParameters(
        command=sys.executable,
        args=[server_path],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    
    return server_params


async def call_tool(session: ClientSession, tool_name: str, arguments: dict):
    """Call a tool on the server"""
    try:
        result = await session.call_tool(tool_name, arguments)
        return result
    except Exception as e:
        print(f"Error calling {tool_name}: {e}")
        return None


async def main():
    """Main client function"""
    server_params = await create_client_session()
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            # List available tools
            print("=" * 60)
            print("Available Tools on MineCode Server:")
            print("=" * 60)
            tools = await session.list_tools()
            for tool in tools.tools:
                print(f"\n📌 {tool.name}")
                print(f"   Description: {tool.description}")
            
            print("\n" + "=" * 60)
            print("Testing Tools:")
            print("=" * 60)
            
            # Test 1: Hello World
            print("\n🧪 Test 1: hello_world (without name)")
            result = await call_tool(session, "hello_world", {})
            if result:
                print(f"   Result: {result.content[0].text}")
            
            # Test 2: Hello World with name
            print("\n🧪 Test 2: hello_world (with name)")
            result = await call_tool(session, "hello_world", {"name": "MineCode Developer"})
            if result:
                print(f"   Result: {result.content[0].text}")
            
            # Test 3: Get Minecraft version
            print("\n🧪 Test 3: get_minecraft_version")
            result = await call_tool(session, "get_minecraft_version", {"version": "1.20.1"})
            if result:
                data = json.loads(result.content[0].text)
                print(f"   Result: {json.dumps(data, indent=2)}")
            
            # Test 4: Search Wiki
            print("\n🧪 Test 4: search_wiki")
            result = await call_tool(session, "search_wiki", {"query": "command"})
            if result:
                data = json.loads(result.content[0].text)
                print(f"   Result: {json.dumps(data, indent=2)}")
            
            # Test 5: List Commands
            print("\n🧪 Test 5: list_commands")
            result = await call_tool(session, "list_commands", {
                "version": "1.20.1",
                "category": "admin"
            })
            if result:
                data = json.loads(result.content[0].text)
                print(f"   Result: {json.dumps(data, indent=2)}")
            
            # Test 6: Validate Datapack
            print("\n🧪 Test 6: validate_datapack")
            result = await call_tool(session, "validate_datapack", {
                "datapack_path": "/path/to/datapack",
                "mc_version": "1.20.1"
            })
            if result:
                data = json.loads(result.content[0].text)
                print(f"   Result: {json.dumps(data, indent=2)}")
            
            print("\n" + "=" * 60)
            print("✅ All tests completed!")
            print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
