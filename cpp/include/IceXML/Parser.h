// **********************************************************************
//
// Copyright (c) 2003
// ZeroC, Inc.
// Billerica, MA, USA
//
// All Rights Reserved.
//
// Ice is free software; you can redistribute it and/or modify it under
// the terms of the GNU General Public License version 2 as published by
// the Free Software Foundation.
//
// **********************************************************************

#ifndef ICE_XML_PARSER_H
#define ICE_XML_PARSER_H

#include <IceUtil/Shared.h>
#include <IceUtil/Handle.h>
#include <IceUtil/Exception.h>

#include <vector>
#include <map>

#ifndef ICE_XML_API
#   ifdef ICE_XML_API_EXPORTS
#       define ICE_XML_API ICE_DECLSPEC_EXPORT
#    else
#       define ICE_XML_API ICE_DECLSPEC_IMPORT
#    endif
#endif

namespace IceXML
{

class ICE_XML_API ParserException : public IceUtil::Exception
{
public:

    ParserException(const std::string&);
    ParserException(const char*, int, const std::string&);

    virtual std::string ice_name() const;
    virtual void ice_print(std::ostream&) const;
    virtual IceUtil::Exception* ice_clone() const;
    virtual void ice_throw() const;

    std::string reason() const;

private:

    std::string _reason;
};

class Node;
typedef IceUtil::Handle< Node > NodePtr;

typedef std::vector<NodePtr> NodeList;

class Element;
typedef IceUtil::Handle< Element > ElementPtr;

class Text;
typedef IceUtil::Handle< Text > TextPtr;

class Document;
typedef IceUtil::Handle< Document > DocumentPtr;

typedef std::map<std::string, std::string> Attributes;

class ICE_XML_API Node : public IceUtil::Shared
{
public:
    virtual ~Node();

    virtual NodePtr getParent() const;
    virtual std::string getName() const;
    virtual std::string getValue() const;
    virtual NodeList getChildren() const;
    virtual Attributes getAttributes() const;
    virtual std::string getAttribute(const std::string&) const;

    virtual bool addChild(const NodePtr&);

    int getLine() const;
    int getColumn() const;

protected:
    Node(const NodePtr&, const std::string&, const std::string&, int, int);

    NodePtr _parent;
    std::string _name;
    std::string _value;
    int _line;
    int _column;
};

class ICE_XML_API Element : public Node
{
public:
    Element(const NodePtr&, const std::string&, const Attributes&, int, int);
    virtual ~Element();

    virtual NodeList getChildren() const;
    virtual Attributes getAttributes() const;
    virtual std::string getAttribute(const std::string&) const;

    virtual bool addChild(const NodePtr&);

private:
    NodeList _children;
    Attributes _attributes;
};

class ICE_XML_API Text : public Node
{
public:
    Text(const NodePtr&, const std::string&, int, int);
    virtual ~Text();
};

class ICE_XML_API Document : public Node
{
public:
    Document();
    virtual ~Document();

    virtual NodeList getChildren() const;

    virtual bool addChild(const NodePtr&);

private:
    NodeList _children;
};

class ICE_XML_API Handler
{
public:
    virtual ~Handler();

    virtual void startElement(const std::string&, const Attributes&, int, int) = 0;
    virtual void endElement(const std::string&, int, int) = 0;
    virtual void characters(const std::string&, int, int) = 0;
    virtual void error(const std::string&, int, int);
};

class ICE_XML_API Parser
{
public:
    static DocumentPtr parse(const std::string&);
    static DocumentPtr parse(std::istream&);

    static void parse(const std::string&, Handler&);
    static void parse(std::istream&, Handler&);
};

}

#endif
