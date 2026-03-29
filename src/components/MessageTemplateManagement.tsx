import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { MessageSquare, Mail, Plus, Edit, Trash2, Code, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { MessageTemplate } from '../types';
import { storageUtils } from '../utils/storage';
import { toast } from 'sonner@2.0.3';
import { Switch } from './ui/switch';

export function MessageTemplateManagement() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showVariablesDialog, setShowVariablesDialog] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'whatsapp' | 'email' | 'tracking_update'>('whatsapp');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    setTemplates(storageUtils.getMessageTemplates());
  };

  const createDefaultTemplates = () => {
    const defaultTemplates: MessageTemplate[] = [
      {
        id: Date.now().toString(),
        name: 'Order Confirmation - WhatsApp',
        type: 'whatsapp',
        content: `🎉 Order Confirmed - Toodies

Order ID: {orderId}
Total: {total}
Status: {status}
Date: {date}

{trackingNumber}

For any queries, contact us on WhatsApp:
📱 {adminWhatsApp}

Thank you for shopping with Toodies! 🛍️`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: (Date.now() + 1).toString(),
        name: 'Order Confirmation - Email',
        type: 'email',
        subject: 'Order Confirmation - {orderId}',
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a0e1a 0%, #0f172a 100%); color: #e0e7ff; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #06b6d4; text-shadow: 0 0 20px rgba(6, 182, 212, 0.5);">Toodies</h1>
    <p style="color: #94a3b8;">Custom Apparel & Design Platform</p>
  </div>
  
  <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 16px; padding: 30px; margin-bottom: 20px;">
    <h2 style="color: #06b6d4; margin-top: 0;">Order Confirmed! 🎉</h2>
    
    <div style="margin: 20px 0;">
      <p><strong style="color: #14b8a6;">Order ID:</strong> {orderId}</p>
      <p><strong style="color: #14b8a6;">Customer:</strong> {customerName}</p>
      <p><strong style="color: #14b8a6;">Date:</strong> {date}</p>
      <p><strong style="color: #14b8a6;">Status:</strong> <span style="color: #22d3ee;">{status}</span></p>
      <p><strong style="color: #14b8a6;">Total:</strong> <span style="color: #06b6d4; font-size: 24px;">{total}</span></p>
    </div>
    
    <div style="background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 12px; padding: 15px; margin-top: 20px;">
      <p style="margin: 0; color: #94a3b8;">Tracking: {trackingNumber}</p>
    </div>
  </div>
  
  <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h3 style="color: #14b8a6; margin-top: 0; font-size: 16px;">Need Help?</h3>
    <p style="margin: 5px 0; color: #e0e7ff;"><strong>Email:</strong> {adminEmail}</p>
    <p style="margin: 5px 0; color: #e0e7ff;"><strong>WhatsApp:</strong> {adminWhatsApp}</p>
  </div>
  
  <div style="text-align: center; color: #94a3b8; font-size: 14px;">
    <p>Thank you for shopping with Toodies!</p>
  </div>
</div>`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: (Date.now() + 2).toString(),
        name: 'Tracking Update - WhatsApp',
        type: 'tracking_update',
        content: `📦 Shipping Update - Toodies

Hi {customerName}! 👋

Your order {orderId} has been shipped!

🚚 Tracking Number: {trackingNumber}
📍 Track your order: {trackingUrl}

Expected delivery in 3-5 business days.

Questions? Contact us:
📱 WhatsApp: {adminWhatsApp}
✉️ Email: {adminEmail}

Thanks for choosing Toodies! 🎉`,
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    defaultTemplates.forEach(template => {
      storageUtils.addMessageTemplate(template);
    });

    loadTemplates();
    toast.success('Default templates created successfully!');
  };

  const resetForm = () => {
    setName('');
    setType('whatsapp');
    setSubject('');
    setContent('');
    setIsActive(true);
    setEditingTemplate(null);
  };

  const handleSave = () => {
    if (!name.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (type === 'email' && !subject.trim()) {
      toast.error('Email templates require a subject');
      return;
    }

    if (editingTemplate) {
      // Update existing template
      const updatedTemplate: MessageTemplate = {
        ...editingTemplate,
        name: name.trim(),
        type,
        subject: type === 'email' ? subject.trim() : undefined,
        content: content.trim(),
        isActive,
        updatedAt: new Date().toISOString()
      };

      storageUtils.updateMessageTemplate(editingTemplate.id, updatedTemplate);
      toast.success('Template updated successfully');
    } else {
      // Create new template
      const newTemplate: MessageTemplate = {
        id: Date.now().toString(),
        name: name.trim(),
        type,
        subject: type === 'email' ? subject.trim() : undefined,
        content: content.trim(),
        isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      storageUtils.addMessageTemplate(newTemplate);
      toast.success('Template created successfully');
    }

    loadTemplates();
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setType(template.type);
    setSubject(template.subject || '');
    setContent(template.content);
    setIsActive(template.isActive);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      storageUtils.deleteMessageTemplate(templateId);
      loadTemplates();
      toast.success('Template deleted successfully');
    }
  };

  const handleToggleActive = (template: MessageTemplate) => {
    const updatedTemplate: MessageTemplate = {
      ...template,
      isActive: !template.isActive,
      updatedAt: new Date().toISOString()
    };
    storageUtils.updateMessageTemplate(template.id, updatedTemplate);
    loadTemplates();
    toast.success(`Template ${updatedTemplate.isActive ? 'activated' : 'deactivated'}`);
  };

  const insertVariable = (variable: string) => {
    setContent(content + `{${variable}}`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const availableVariables = [
    { name: 'orderId', description: 'Order ID' },
    { name: 'total', description: 'Order total amount' },
    { name: 'status', description: 'Order status' },
    { name: 'date', description: 'Order date' },
    { name: 'customerName', description: 'Customer name' },
    { name: 'customerEmail', description: 'Customer email' },
    { name: 'customerMobile', description: 'Customer mobile' },
    { name: 'trackingNumber', description: 'Tracking number' },
    { name: 'trackingUrl', description: 'Tracking URL' },
    { name: 'adminWhatsApp', description: 'Admin WhatsApp number' },
    { name: 'adminEmail', description: 'Admin email' },
    { name: 'shippingAddress', description: 'Shipping address' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Message Templates
          </h2>
          <p className="text-gray-400 mt-1">
            Create and manage notification templates for WhatsApp and Email
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowVariablesDialog(true)}
            variant="outline"
            className="border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10"
          >
            <Code className="mr-2 h-4 w-4" />
            Available Variables
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0e1a] border-cyan-500/30 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-cyan-400">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {editingTemplate ? 'Update the template details below' : 'Fill in the details to create a new message template'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="template-name" className="text-cyan-400">Template Name *</Label>
                  <Input
                    id="template-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Order Confirmation WhatsApp"
                    className="bg-slate-900/50 border-cyan-500/30 text-white placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <Label htmlFor="template-type" className="text-cyan-400">Template Type *</Label>
                  <Select value={type} onValueChange={(value: any) => setType(value)}>
                    <SelectTrigger className="bg-slate-900/50 border-cyan-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-cyan-500/30">
                      <SelectItem value="whatsapp" className="text-white hover:bg-cyan-500/20">
                        WhatsApp Message
                      </SelectItem>
                      <SelectItem value="email" className="text-white hover:bg-cyan-500/20">
                        Email
                      </SelectItem>
                      <SelectItem value="tracking_update" className="text-white hover:bg-cyan-500/20">
                        Tracking Update
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {type === 'email' && (
                  <div>
                    <Label htmlFor="template-subject" className="text-cyan-400">Email Subject *</Label>
                    <Input
                      id="template-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Order Confirmation - {orderId}"
                      className="bg-slate-900/50 border-cyan-500/30 text-white placeholder:text-gray-500"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="template-content" className="text-cyan-400">
                      {type === 'email' ? 'Email Content (HTML supported) *' : 'Message Content *'}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowVariablesDialog(true)}
                      className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10"
                    >
                      <Code className="h-3 w-3 mr-1" />
                      Insert Variable
                    </Button>
                  </div>
                  <Textarea
                    id="template-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={type === 'email' 
                      ? 'Use HTML for rich formatting. Variables: {orderId}, {total}, {customerName}, etc.'
                      : 'Use variables like {orderId}, {total}, {customerName}, etc.'
                    }
                    rows={type === 'email' ? 12 : 8}
                    className="bg-slate-900/50 border-cyan-500/30 text-white placeholder:text-gray-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use curly braces for variables: {'{orderId}'}, {'{total}'}, {'{customerName}'}, etc.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="template-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    className="data-[state=checked]:bg-cyan-500"
                  />
                  <Label htmlFor="template-active" className="text-white cursor-pointer">
                    Active (will be used for notifications)
                  </Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                    variant="outline"
                    className="border-gray-600 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Templates List */}
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-cyan-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-cyan-400">Message Templates</CardTitle>
          <CardDescription className="text-gray-400">
            Manage your notification templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <p className="text-gray-400 mb-2">No templates created yet</p>
              <p className="text-gray-500 text-sm mb-6">
                Create your first template to customize notifications
              </p>
              <Button
                onClick={createDefaultTemplates}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Default Templates
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-cyan-500/20 hover:bg-transparent">
                    <TableHead className="text-cyan-400">Name</TableHead>
                    <TableHead className="text-cyan-400">Type</TableHead>
                    <TableHead className="text-cyan-400">Status</TableHead>
                    <TableHead className="text-cyan-400">Last Updated</TableHead>
                    <TableHead className="text-cyan-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <motion.tr
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-cyan-500/10 hover:bg-cyan-500/5"
                    >
                      <TableCell className="text-white font-medium">
                        {template.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(template.type)}
                          <span className="text-gray-300 capitalize">
                            {template.type.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            template.isActive
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }
                        >
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <div
                            onClick={() => handleToggleActive(template)}
                            className="inline-flex items-center justify-center hover:opacity-80 cursor-pointer"
                          >
                            <Switch
                              checked={template.isActive}
                              className="data-[state=checked]:bg-cyan-500"
                            />
                          </div>
                          <Button
                            onClick={() => handleEdit(template)}
                            variant="ghost"
                            size="sm"
                            className="hover:bg-cyan-500/10 hover:text-cyan-400"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(template.id)}
                            variant="ghost"
                            size="sm"
                            className="hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Variables Dialog */}
      <Dialog open={showVariablesDialog} onOpenChange={setShowVariablesDialog}>
        <DialogContent className="bg-[#0a0e1a] border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Available Variables
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Click on a variable to insert it into your template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
            {availableVariables.map((variable) => (
              <div
                key={variable.name}
                onClick={() => {
                  insertVariable(variable.name);
                  toast.success(`Inserted {${variable.name}}`);
                }}
                className="p-3 bg-slate-900/50 border border-cyan-500/20 rounded-lg hover:border-cyan-400 hover:bg-cyan-500/5 cursor-pointer transition-all group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <code className="text-cyan-400 font-mono text-sm">
                      {'{' + variable.name + '}'}
                    </code>
                    <p className="text-gray-400 text-xs mt-1">
                      {variable.description}
                    </p>
                  </div>
                  <Code className="h-4 w-4 text-gray-600 group-hover:text-cyan-400" />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}