import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { User as UserType } from '../types';
import { storageUtils } from '../utils/storage';
import { Users, Mail, Phone, MapPin, ShoppingBag, Package, CheckCircle2, XCircle, Edit2, Trash2, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';

export function CustomerManagement() {
  const [customers, setCustomers] = useState<UserType[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<UserType | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<UserType | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery]);

  const loadCustomers = () => {
    const allCustomers = storageUtils.getUsers();
    setCustomers(allCustomers);
  };

  const filterCustomers = () => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(customer =>
      customer.name?.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.mobile.includes(query) ||
      customer.id.includes(query)
    );
    setFilteredCustomers(filtered);
  };

  const handleViewCustomer = (customer: UserType) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const handleEditCustomer = (customer: UserType) => {
    setEditedCustomer({ ...customer });
    setIsEditDialogOpen(true);
  };

  const handleSaveCustomer = () => {
    if (!editedCustomer) return;

    const users = storageUtils.getUsers();
    const index = users.findIndex(u => u.id === editedCustomer.id);
    if (index !== -1) {
      users[index] = editedCustomer;
      storageUtils.saveUsers(users);
      
      // Update current user if they're logged in
      const currentUser = storageUtils.getCurrentUser();
      if (currentUser && currentUser.id === editedCustomer.id) {
        storageUtils.updateCurrentUser(editedCustomer);
      }

      loadCustomers();
      setIsEditDialogOpen(false);
      toast.success('Customer updated successfully!');
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      const users = storageUtils.getUsers();
      const filtered = users.filter(u => u.id !== customerId);
      storageUtils.saveUsers(filtered);
      
      // Also delete their orders
      const orders = storageUtils.getOrders();
      const filteredOrders = orders.filter(o => o.userId !== customerId);
      storageUtils.saveOrders(filteredOrders);

      loadCustomers();
      toast.success('Customer deleted successfully!');
    }
  };

  const toggleVerification = (field: 'email' | 'mobile') => {
    if (!editedCustomer) return;

    if (field === 'email') {
      setEditedCustomer({ ...editedCustomer, emailVerified: !editedCustomer.emailVerified });
    } else {
      setEditedCustomer({ ...editedCustomer, mobileVerified: !editedCustomer.mobileVerified });
    }
  };

  const getTotalSpent = (customer: UserType) => {
    return customer.orders.reduce((sum, order) => sum + order.total, 0);
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-2 border-cyan-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-cyan-100 flex items-center gap-2">
                <Users className="w-6 h-6 text-cyan-400" />
                Customer Management
              </CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                View and manage all customer profiles and their orders
              </CardDescription>
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-lg px-4 py-2">
              {customers.length} Customers
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
            <Input
              placeholder="Search by name, email, mobile, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500"
            />
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-card border border-cyan-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Total Customers</p>
                    <p className="text-2xl font-bold text-cyan-100 mt-1">{customers.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-cyan-400/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Verified</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">
                      {customers.filter(c => c.emailVerified && c.mobileVerified).length}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-400/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Active Orders</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">
                      {customers.reduce((sum, c) => sum + c.orders.filter(o => o.status !== 'delivered').length, 0)}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-yellow-400/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-bold text-purple-400 mt-1">
                      ₹{customers.reduce((sum, c) => sum + getTotalSpent(c), 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-purple-400/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Table */}
          <div className="border border-cyan-500/20 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-cyan-500/20 hover:bg-cyan-500/5">
                  <TableHead className="text-cyan-400">Customer</TableHead>
                  <TableHead className="text-cyan-400">Contact</TableHead>
                  <TableHead className="text-cyan-400">Verification</TableHead>
                  <TableHead className="text-cyan-400">Orders</TableHead>
                  <TableHead className="text-cyan-400">Total Spent</TableHead>
                  <TableHead className="text-cyan-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow 
                      key={customer.id} 
                      className="border-cyan-500/10 hover:bg-cyan-500/5 cursor-pointer"
                      onClick={() => handleViewCustomer(customer)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-cyan-100 font-medium">
                            {customer.name || 'No Name'}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">ID: {customer.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Mail className="w-3 h-3 text-cyan-500" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Phone className="w-3 h-3 text-cyan-500" />
                            {customer.mobile}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant={customer.emailVerified ? "default" : "outline"}
                            className={customer.emailVerified ? "bg-green-500/20 text-green-400 border-green-500/30" : "border-red-500/30 text-red-400"}
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            {customer.emailVerified ? 'Verified' : 'Not Verified'}
                          </Badge>
                          <Badge 
                            variant={customer.mobileVerified ? "default" : "outline"}
                            className={customer.mobileVerified ? "bg-green-500/20 text-green-400 border-green-500/30" : "border-red-500/30 text-red-400"}
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            {customer.mobileVerified ? 'Verified' : 'Not Verified'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                          {customer.orders.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-cyan-100 font-bold">
                          ₹{getTotalSpent(customer).toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCustomer(customer)}
                            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent aria-describedby={undefined} className="glass-card border-2 border-cyan-500/30 bg-[#0a0e1a] max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-cyan-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-cyan-400" />
              Customer Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6 pt-4">
              {/* Basic Info */}
              <Card className="glass-card border border-cyan-500/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-cyan-500/20">
                    <span className="text-slate-400">Name</span>
                    <span className="text-cyan-100 font-medium">{selectedCustomer.name || 'Not Set'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-cyan-500/20">
                    <span className="text-slate-400">Email</span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-100">{selectedCustomer.email}</span>
                      {selectedCustomer.emailVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-cyan-500/20">
                    <span className="text-slate-400">Mobile</span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-100">{selectedCustomer.mobile}</span>
                      {selectedCustomer.mobileVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-start pb-3 border-b border-cyan-500/20">
                    <span className="text-slate-400">Address</span>
                    <span className="text-cyan-100 text-right max-w-xs">{selectedCustomer.address || 'Not Set'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Customer ID</span>
                    <span className="text-cyan-100 font-mono text-sm">{selectedCustomer.id}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="glass-card border border-cyan-500/20">
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold text-cyan-100 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-cyan-400" />
                    Order Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Total Orders</p>
                      <p className="text-2xl font-bold text-cyan-100">{selectedCustomer.orders.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Total Spent</p>
                      <p className="text-2xl font-bold text-cyan-100">₹{getTotalSpent(selectedCustomer).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Cart Items</p>
                      <p className="text-2xl font-bold text-cyan-100">{selectedCustomer.cart.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Average Order</p>
                      <p className="text-2xl font-bold text-cyan-100">
                        ₹{selectedCustomer.orders.length > 0 
                          ? Math.round(getTotalSpent(selectedCustomer) / selectedCustomer.orders.length).toLocaleString('en-IN')
                          : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent aria-describedby={undefined} className="glass-card border-2 border-cyan-500/30 bg-[#0a0e1a] max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-cyan-100 flex items-center gap-2">
              <Edit2 className="w-6 h-6 text-cyan-400" />
              Edit Customer
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Update customer information and verification status
            </DialogDescription>
          </DialogHeader>
          
          {editedCustomer && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-cyan-100">Full Name</Label>
                <Input
                  value={editedCustomer.name || ''}
                  onChange={(e) => setEditedCustomer({ ...editedCustomer, name: e.target.value })}
                  className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-cyan-100">Email</Label>
                <div className="flex gap-2">
                  <Input
                    value={editedCustomer.email}
                    onChange={(e) => setEditedCustomer({ ...editedCustomer, email: e.target.value })}
                    className="flex-1 bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
                  />
                  <Button
                    variant="outline"
                    onClick={() => toggleVerification('email')}
                    className={editedCustomer.emailVerified 
                      ? "border-green-500/30 text-green-400 hover:bg-green-500/10" 
                      : "border-red-500/30 text-red-400 hover:bg-red-500/10"}
                  >
                    {editedCustomer.emailVerified ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                    {editedCustomer.emailVerified ? 'Verified' : 'Not Verified'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-cyan-100">Mobile Number</Label>
                <div className="flex gap-2">
                  <Input
                    value={editedCustomer.mobile}
                    onChange={(e) => setEditedCustomer({ ...editedCustomer, mobile: e.target.value })}
                    className="flex-1 bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
                  />
                  <Button
                    variant="outline"
                    onClick={() => toggleVerification('mobile')}
                    className={editedCustomer.mobileVerified 
                      ? "border-green-500/30 text-green-400 hover:bg-green-500/10" 
                      : "border-red-500/30 text-red-400 hover:bg-red-500/10"}
                  >
                    {editedCustomer.mobileVerified ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                    {editedCustomer.mobileVerified ? 'Verified' : 'Not Verified'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-cyan-100">Shipping Address</Label>
                <Textarea
                  value={editedCustomer.address || ''}
                  onChange={(e) => setEditedCustomer({ ...editedCustomer, address: e.target.value })}
                  className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 min-h-24"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCustomer}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
